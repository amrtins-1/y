import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

@Entity({ name: 'membership_plan' })
export class MembershipPlan extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false, unique: true })
  code!: string;

  @Column({ nullable: false })
  name!: string;

  @Column({ nullable: true })
  description?: string | null;

  @Column({ name: 'price_monthly', type: 'numeric', precision: 38, scale: 2, nullable: false })
  priceMonthly!: string;

  @Column({ name: 'benefits', type: 'jsonb', nullable: true, default: () => "'[]'" })
  benefits!: string | unknown;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;
}
