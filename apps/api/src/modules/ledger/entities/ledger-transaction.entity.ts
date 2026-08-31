import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { LedgerEntry } from './ledger-entry.entity';

export enum ReferenceType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

@Entity('ledger_transactions')
export class LedgerTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReferenceType,
  })
  referenceType: ReferenceType;

  @Column({ name: 'reference_id' })
  referenceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => LedgerEntry, (entry) => entry.ledgerTransaction, { cascade: true })
  entries: LedgerEntry[];
}
