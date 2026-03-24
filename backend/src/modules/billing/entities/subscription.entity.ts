import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'pro' })
  plan: 'basic' | 'pro';

  @Column({ default: 'trialing' })
  status: 'trialing' | 'active' | 'expired' | 'cancelled';

  @Column({ default: 'monthly' })
  billingCycle: 'monthly' | 'yearly';

  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodStartAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  currentPeriodEndsAt: Date | null;

  @Column({ default: 0 })
  addonWorkspaceSlots: number;

  @Column({ default: 0 })
  addonStaffSeats: number;

  @Column({ default: 0 })
  addonWhatsappBundles: number;

  @Column({ default: 0 })
  whatsappMessagesUsedThisMonth: number;

  @Column({ type: 'timestamp', nullable: true })
  whatsappUsageResetAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  paystackCustomerCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  paystackSubscriptionCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastPaymentReference: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
