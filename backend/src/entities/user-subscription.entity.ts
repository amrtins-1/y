import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AppUser } from './app-user.entity';
import { MembershipPlan } from './membership-plan.entity';
import { SubscriptionStatus } from './enums';

@Entity({ name: 'user_subscription' })
export class UserSubscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;

  @ManyToOne(() => MembershipPlan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan!: MembershipPlan;

  @Column({ nullable: false, default: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  startedAt!: Date;

  @Column({ name: 'current_period_start', type: 'timestamptz', nullable: true })
  currentPeriodStart?: Date | null;

  @Column({ name: 'current_period_end', type: 'timestamptz', nullable: true })
  currentPeriodEnd?: Date | null;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt?: Date | null;

  @Column({ name: 'payment_provider', nullable: true })
  paymentProvider?: string | null;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId?: string | null;

  @Column({ name: 'provider_subscription_id', nullable: true })
  providerSubscriptionId?: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;
}
