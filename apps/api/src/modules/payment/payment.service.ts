import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PaymentIntent, PaymentIntentStatus } from './entities/payment-intent.entity';
import { LedgerService } from '../ledger/ledger.service';
import { EntryType } from '../ledger/entities/ledger-entry.entity';
import { ReferenceType } from '../ledger/entities/ledger-transaction.entity';
import { LedgerAccountType } from '../ledger/entities/ledger-account.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentIntent)
    private paymentIntentRepository: Repository<PaymentIntent>,
    private ledgerService: LedgerService,
    private dataSource: DataSource,
  ) {}

  async createIntent(merchantId: string, payload: any): Promise<PaymentIntent> {
    const { amount, currency, paymentMethod } = payload;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (!currency || currency.length !== 3) {
      throw new BadRequestException('Invalid currency code');
    }

    const intent = new PaymentIntent();
    intent.merchantId = merchantId;
    intent.amount = amount;
    intent.currency = currency.toUpperCase();
    intent.paymentMethod = paymentMethod || {};
    intent.status = PaymentIntentStatus.REQUIRES_PAYMENT_METHOD;

    return this.paymentIntentRepository.save(intent);
  }

  async confirmIntent(intentId: string, merchantId: string): Promise<PaymentIntent> {
    const intent = await this.paymentIntentRepository.findOne({
      where: { id: intentId, merchantId },
    });

    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }

    if (intent.status !== PaymentIntentStatus.REQUIRES_PAYMENT_METHOD && intent.status !== PaymentIntentStatus.REQUIRES_CONFIRMATION) {
      throw new BadRequestException(`Payment intent cannot be confirmed in state: ${intent.status}`);
    }

    intent.status = PaymentIntentStatus.PROCESSING;
    await this.paymentIntentRepository.save(intent);

    // Simulated Gateway Authorization & Capture
    const cardNumber = intent.paymentMethod?.card?.number || '';
    
    // Stripe-like testing rules: card ending with '5555' will decline
    const isDeclined = cardNumber.endsWith('5555');

    // Run core financial operations in a strict Database Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (isDeclined) {
        intent.status = PaymentIntentStatus.FAILED;
        await queryRunner.manager.save(intent);
        await queryRunner.commitTransaction();
        return intent;
      }

      // Capture Success path
      intent.status = PaymentIntentStatus.SUCCEEDED;
      const savedIntent = await queryRunner.manager.save(intent);

      // Ledger balancing entries:
      // Ensure merchant ledger accounts exist for this currency
      const accounts = await this.ledgerService.ensureAccountsExist(merchantId, intent.currency);
      const gatewayAccount = accounts.find((a) => a.type === LedgerAccountType.GATEWAY);
      const merchantAccount = accounts.find((a) => a.type === LedgerAccountType.MERCHANT);

      if (!gatewayAccount || !merchantAccount) {
        throw new BadRequestException('Ledger accounts configuration missing');
      }

      // Record double-entry movement:
      // Debit Asset: Gateway Account (+ balance)
      // Credit Revenue: Merchant Account (+ balance)
      const entries = [
        {
          ledgerAccountId: gatewayAccount.id,
          type: EntryType.DEBIT,
          amount: intent.amount,
        },
        {
          ledgerAccountId: merchantAccount.id,
          type: EntryType.CREDIT,
          amount: intent.amount,
        },
      ];

      await this.ledgerService.recordDoubleEntry(
        ReferenceType.PAYMENT,
        savedIntent.id,
        entries,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      // Trigger Webhook emission asynchronously (via a separate task context, which we will hook up)
      this.dispatchWebhookEvent(merchantId, 'payment.succeeded', savedIntent);

      return savedIntent;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      
      // Mark payment intent as failed on system errors
      intent.status = PaymentIntentStatus.FAILED;
      await this.paymentIntentRepository.save(intent);
      
      throw new BadRequestException(`Payment confirmation failed: ${err.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async getDetails(intentId: string, merchantId: string): Promise<PaymentIntent> {
    const intent = await this.paymentIntentRepository.findOne({
      where: { id: intentId, merchantId },
    });
    if (!intent) {
      throw new NotFoundException('Payment intent not found');
    }
    return intent;
  }

  async getHistory(merchantId: string): Promise<PaymentIntent[]> {
    return this.paymentIntentRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  private async dispatchWebhookEvent(merchantId: string, eventType: string, payload: any) {
    // We will dynamically import WebhookService or resolve it via Nest context to avoid circular dependencies
    try {
      // Background execution: webhook dispatch does not block payment completion
      const moduleRef = (global as any).nestAppModuleRef;
      if (moduleRef) {
        const { WebhookService } = await import('../webhook/webhook.service');
        const webhookService = moduleRef.get(WebhookService);
        await webhookService.triggerEvent(merchantId, eventType, payload);
      }
    } catch (e) {
      // Suppress background errors to keep payments active
      console.error(`Background webhook dispatch error: ${e.message}`);
    }
  }
}
