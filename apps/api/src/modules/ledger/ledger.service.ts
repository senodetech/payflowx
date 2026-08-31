import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { LedgerAccount, LedgerAccountType } from './entities/ledger-account.entity';
import { LedgerTransaction, ReferenceType } from './entities/ledger-transaction.entity';
import { LedgerEntry, EntryType } from './entities/ledger-entry.entity';

@Injectable()
export class LedgerService {
  constructor(
    @InjectRepository(LedgerAccount)
    private accountRepository: Repository<LedgerAccount>,
    @InjectRepository(LedgerTransaction)
    private transactionRepository: Repository<LedgerTransaction>,
    @InjectRepository(LedgerEntry)
    private entryRepository: Repository<LedgerEntry>,
  ) {}

  async ensureAccountsExist(merchantId: string, currency: string): Promise<LedgerAccount[]> {
    const types = [LedgerAccountType.CUSTOMER, LedgerAccountType.GATEWAY, LedgerAccountType.MERCHANT];
    const accounts: LedgerAccount[] = [];

    for (const type of types) {
      let account = await this.accountRepository.findOne({
        where: { merchantId, type, currency },
      });

      if (!account) {
        account = new LedgerAccount();
        account.merchantId = merchantId;
        account.type = type;
        account.currency = currency;
        account.balance = 0;
        account = await this.accountRepository.save(account);
      }
      accounts.push(account);
    }
    return accounts;
  }

  async getBalances(merchantId: string): Promise<LedgerAccount[]> {
    return this.accountRepository.find({ where: { merchantId } });
  }

  async getTransactionHistory(merchantId: string): Promise<any[]> {
    // Return ledger entries with transactions for the merchant's accounts
    const accounts = await this.accountRepository.find({ where: { merchantId } });
    const accountIds = accounts.map((a) => a.id);

    if (accountIds.length === 0) {
      return [];
    }

    return this.entryRepository.find({
      where: accountIds.map((id) => ({ ledgerAccountId: id })),
      relations: ['ledgerTransaction', 'ledgerAccount'],
      order: { createdAt: 'DESC' },
    });
  }

  async recordDoubleEntry(
    referenceType: ReferenceType,
    referenceId: string,
    entries: { ledgerAccountId: string; type: EntryType; amount: number }[],
    entityManager: EntityManager,
  ): Promise<LedgerTransaction> {
    // 1. Validate that the sum of Debits equals the sum of Credits
    const totalDebit = entries
      .filter((e) => e.type === EntryType.DEBIT)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = entries
      .filter((e) => e.type === EntryType.CREDIT)
      .reduce((sum, e) => sum + e.amount, 0);

    // Using epsilon subtraction to avoid JS floating point inaccuracies
    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `Ledger imbalance detected. Debits: ${totalDebit}, Credits: ${totalCredit}. They must be equal.`,
      );
    }

    // 2. Save LedgerTransaction
    const tx = new LedgerTransaction();
    tx.referenceType = referenceType;
    tx.referenceId = referenceId;
    const savedTx = await entityManager.save(tx);

    // 3. Save Entries and update account balances
    for (const entryData of entries) {
      // Fetch account within transaction lock to prevent race conditions
      const account = await entityManager.findOne(LedgerAccount, {
        where: { id: entryData.ledgerAccountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!account) {
        throw new NotFoundException(`Ledger account ${entryData.ledgerAccountId} not found`);
      }

      // Financial balance calculation rules:
      // Asset accounts (CUSTOMER, GATEWAY): DEBIT increases (+), CREDIT decreases (-)
      // Revenue accounts (MERCHANT): CREDIT increases (+), DEBIT decreases (-)
      const isAsset =
        account.type === LedgerAccountType.GATEWAY ||
        account.type === LedgerAccountType.CUSTOMER;

      if (isAsset) {
        if (entryData.type === EntryType.DEBIT) {
          account.balance += entryData.amount;
        } else {
          account.balance -= entryData.amount;
        }
      } else {
        // Merchant Account (Revenue)
        if (entryData.type === EntryType.CREDIT) {
          account.balance += entryData.amount;
        } else {
          account.balance -= entryData.amount;
        }
      }

      await entityManager.save(account);

      // Create Ledger Entry
      const entry = new LedgerEntry();
      entry.ledgerTransactionId = savedTx.id;
      entry.ledgerAccountId = account.id;
      entry.type = entryData.type;
      entry.amount = entryData.amount;
      await entityManager.save(entry);
    }

    return savedTx;
  }
}
