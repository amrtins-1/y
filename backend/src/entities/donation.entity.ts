import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsEmail, IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
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
  @IsString()
  @MaxLength(120)
  @Column({ name: 'donor_name', type: 'varchar', nullable: true })
  donorName?: string | null;

  @IsOptional()
  @IsString()
  @IsEmail()
  @MaxLength(180)
  @Column({ name: 'donor_email', type: 'varchar', nullable: true })
  donorEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9()+\-\s]{10,40}$/)
  @Column({ name: 'donor_phone', type: 'varchar', nullable: true })
  donorPhone?: string | null;

  @IsNumberString()
  @IsNotEmpty()
  @Column({ type: 'numeric', precision: 38, scale: 2, nullable: false })
  amount!: string;

  @IsEnum(DonationFrequency)
  @Column({ nullable: false })
  frequency!: DonationFrequency;

  @Column({ nullable: false, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Matches(/^[A-Z]{3}$/)
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
