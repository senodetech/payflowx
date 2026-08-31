import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { LedgerTransaction } from './ledger-transaction.entity';
import { LedgerAccount } from './ledger-account.entity';

export enum EntryType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => LedgerTransaction, (tx) => tx.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ledger_transaction_id' })
  ledgerTransaction: LedgerTransaction;

  @Column({ name: 'ledger_transaction_id' })
  ledgerTransactionId: string;

  @ManyToOne(() => LedgerAccount, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ledger_account_id' })
  ledgerAccount: LedgerAccount;

  @Column({ name: 'ledger_account_id' })
  ledgerAccountId: string;

  @Column({
    type: 'enum',
    enum: EntryType,
  })
  type: EntryType;

  @Column({ type: 'decimal', precision: 20, scale: 4, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
