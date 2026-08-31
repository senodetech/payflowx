import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentIntent } from '../../payment/entities/payment-intent.entity';

export enum RefundStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentIntent, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_intent_id' })
  paymentIntent: PaymentIntent;

  @Column({ name: 'payment_intent_id' })
  paymentIntentId: string;

  @Column({ type: 'decimal', precision: 20, scale: 4, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value),
  }})
  amount: number;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  status: RefundStatus;

  @Column({ nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
