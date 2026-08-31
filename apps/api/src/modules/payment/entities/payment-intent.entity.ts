import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';

export enum PaymentIntentStatus {
  REQUIRES_PAYMENT_METHOD = 'REQUIRES_PAYMENT_METHOD',
  REQUIRES_CONFIRMATION = 'REQUIRES_CONFIRMATION',
  PROCESSING = 'PROCESSING',
  REQUIRES_CAPTURE = 'REQUIRES_CAPTURE',
  SUCCEEDED = 'SUCCEEDED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
}

@Entity('payment_intents')
@Index('idx_payment_intents_merchant_status', ['merchantId', 'status'])
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  amount: number;

  @Column({ length: 3 })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentIntentStatus,
    default: PaymentIntentStatus.REQUIRES_PAYMENT_METHOD,
  })
  status: PaymentIntentStatus;

  @Column({ type: 'jsonb', name: 'payment_method', nullable: true })
  paymentMethod: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
