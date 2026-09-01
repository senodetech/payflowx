import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from '../../merchant/entities/merchant.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  MERCHANT_OWNER = 'MERCHANT_OWNER',
  MERCHANT_USER = 'MERCHANT_USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MERCHANT_USER,
  })
  role: UserRole;

  @ManyToOne(() => Merchant, (merchant) => merchant.users, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @Column({ name: 'merchant_id', nullable: true })
  merchantId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
