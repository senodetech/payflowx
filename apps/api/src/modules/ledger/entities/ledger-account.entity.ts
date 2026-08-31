import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';

export enum LedgerAccountType {
  CUSTOMER = 'CUSTOMER',
  GATEWAY = 'GATEWAY',
  MERCHANT = 'MERCHANT',
}

@Entity('ledger_accounts')
@Unique('uq_ledger_accounts_merchant_type_currency', ['merchantId', 'type', 'currency'])
export class LedgerAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({
    type: 'enum',
    enum: LedgerAccountType,
  })
  type: LedgerAccountType;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  balance: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
