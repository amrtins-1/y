import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { AppUser } from './app-user.entity';
import { DonationFrequency, PaymentStatus } from './enums';

@Entity({ name: 'donation' })
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user?: AppUser | null;

  @IsOptional()
  @MaxLength(120)
  @Column({ name: 'donor_name', type: 'varchar', nullable: true })
  donorName?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  @Column({ name: 'donor_email', type: 'varchar', nullable: true })
  donorEmail?: string | null;

  @IsOptional()
  @MaxLength(40)
  @Column({ name: 'donor_phone', type: 'varchar', nullable: true })
  donorPhone?: string | null;

  @IsNotEmpty()
  @Column({ type: 'numeric', precision: 38, scale: 2, nullable: false })
  amount!: string;

  @Column({ nullable: false })
  frequency!: DonationFrequency;

  @Column({ nullable: false, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ nullable: false, length: 3, default: 'BRL' })
  currency!: string;

  @IsOptional()
  @Column({ name: 'payment_provider', type: 'varchar', nullable: true })
  paymentProvider?: string | null;

  @IsOptional()
  @Column({ name: 'provider_payment_id', type: 'varchar', nullable: true })
  providerPaymentId?: string | null;

  @IsOptional()
  @Column({ name: 'receipt_url', type: 'varchar', nullable: true })
  receiptUrl?: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date | null;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;
}
