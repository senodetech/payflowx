import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Refund, RefundStatus } from './entities/refund.entity';
import { PaymentIntent, PaymentIntentStatus } from '../payment/entities/payment-intent.entity';
import { LedgerService } from '../ledger/ledger.service';
import { EntryType } from '../ledger/entities/ledger-entry.entity';
import { ReferenceType } from '../ledger/entities/ledger-transaction.entity';
import { LedgerAccountType } from '../ledger/entities/ledger-account.entity';

@Injectable()
export class RefundService {
  constructor(
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(PaymentIntent)
    private paymentIntentRepository: Repository<PaymentIntent>,
    private ledgerService: LedgerService,
    private dataSource: DataSource,
  ) {}

  async createRefund(merchantId: string, payload: any): Promise<Refund> {
    const { paymentIntentId, amount, reason } = payload;

    const intent = await this.paymentIntentRepository.findOne({
      where: { id: paymentIntentId, merchantId },
    });

    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (intent.status !== PaymentIntentStatus.SUCCEEDED) {
      throw new BadRequestException('Only succeeded payments can be refunded');
    }

    // Get total refunded amount for this payment intent
    const existingRefunds = await this.refundRepository.find({
      where: { paymentIntentId, status: RefundStatus.SUCCEEDED },
    });
    const totalRefunded = existingRefunds.reduce((sum, r) => sum + r.amount, 0);

    if (totalRefunded + amount > intent.amount) {
      throw new BadRequestException(
        `Refund amount of ${amount} exceeds remaining refundable balance of ${intent.amount - totalRefunded}`,
      );
    }

    const refund = new Refund();
    refund.paymentIntentId = paymentIntentId;
    refund.amount = amount;
    refund.reason = reason || 'Customer request';
    refund.status = RefundStatus.PENDING;

    // Run core financial ledger updates in a strict Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      refund.status = RefundStatus.SUCCEEDED;
      const savedRefund = await queryRunner.manager.save(refund);

      // Determine updated PaymentIntent status
      const isFullRefund = totalRefunded + amount === intent.amount;
      intent.status = isFullRefund ? PaymentIntentStatus.CANCELED : intent.status; // stripe transitions to canceled or has dedicated refund status. Let's make it standard
      // In custom requirements: PaymentIntent status transitions to CANCELED or stays SUCCEEDED but has separate state.
      // We will mark intent status as CANCELED on full refund or stay as is. Let's keep it simple.
      await queryRunner.manager.save(intent);

      // Ledger balancing entries for Refund:
      // Ensure accounts exist
      const accounts = await this.ledgerService.ensureAccountsExist(merchantId, intent.currency);
      const merchantAccount = accounts.find((a) => a.type === LedgerAccountType.MERCHANT);
      const customerAccount = accounts.find((a) => a.type === LedgerAccountType.CUSTOMER);

      if (!merchantAccount || !customerAccount) {
        throw new BadRequestException('Ledger accounts configuration missing');
      }

      // Record double-entry movement:
      // Debit Revenue: Merchant Account (- balance)
      // Credit Liability: Customer Account (+ balance)
      const entries = [
        {
          ledgerAccountId: merchantAccount.id,
          type: EntryType.DEBIT,
          amount: amount,
        },
        {
          ledgerAccountId: customerAccount.id,
          type: EntryType.CREDIT,
          amount: amount,
        },
      ];

      await this.ledgerService.recordDoubleEntry(
        ReferenceType.REFUND,
        savedRefund.id,
        entries,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      // Trigger Webhook Event dispatch in background
      this.dispatchWebhookEvent(merchantId, 'refund.succeeded', savedRefund);

      return savedRefund;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      refund.status = RefundStatus.FAILED;
      await this.refundRepository.save(refund);
      throw new BadRequestException(`Refund execution failed: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getHistory(merchantId: string): Promise<Refund[]> {
    // Find refunds associated with any of the merchant's payments
    const payments = await this.paymentIntentRepository.find({
      where: { merchantId },
    });
    const paymentIds = payments.map((p) => p.id);

    if (paymentIds.length === 0) {
      return [];
    }

    return this.refundRepository.find({
      where: paymentIds.map((id) => ({ paymentIntentId: id })),
      relations: ['paymentIntent'],
      order: { createdAt: 'DESC' },
    });
  }

  private async dispatchWebhookEvent(merchantId: string, eventType: string, payload: any) {
    try {
      const moduleRef = (global as any).nestAppModuleRef;
      if (moduleRef) {
        const { WebhookService } = await import('../webhook/webhook.service');
        const webhookService = moduleRef.get(WebhookService);
        await webhookService.triggerEvent(merchantId, eventType, payload);
      }
    } catch (e) {
      console.error(`Background webhook dispatch error: ${e.message}`);
    }
  }
}
