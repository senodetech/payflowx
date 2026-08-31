import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';

export enum WebhookEndpointStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('webhook_endpoints')
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Merchant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'merchant_id' })
  merchantId: string;

  @Column()
  url: string;

  @Column()
  secret: string;

  @Column({
    type: 'enum',
    enum: WebhookEndpointStatus,
    default: WebhookEndpointStatus.ACTIVE,
  })
  status: WebhookEndpointStatus;

  @Column({ type: 'jsonb', name: 'enabled_events' })
  enabledEvents: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
