import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { AppUser } from './app-user.entity';
import { TicketStatus } from './enums';

@Entity({ name: 'contact_message' })
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user?: AppUser | null;

  @IsNotEmpty()
  @MaxLength(120)
  @Column({ nullable: false })
  name!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(180)
  @Column({ nullable: false })
  email!: string;

  @IsOptional()
  @MaxLength(40)
  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @IsNotEmpty()
  @MaxLength(160)
  @Column({ nullable: false })
  subject!: string;

  @IsNotEmpty()
  @Column({ type: 'text', nullable: false })
  message!: string;

  @IsOptional()
  @MaxLength(100)
  @Column({ type: 'varchar', nullable: true })
  country?: string | null;

  @IsOptional()
  @MaxLength(100)
  @Column({ type: 'varchar', nullable: true })
  state?: string | null;

  @IsOptional()
  @MaxLength(120)
  @Column({ type: 'varchar', nullable: true })
  city?: string | null;

  @Column({ name: 'is_manual_location', nullable: false, default: false })
  isManualLocation!: boolean;

  @Column({ name: 'newsletter_opt_in', nullable: false, default: false })
  newsletterOptIn!: boolean;

  @Column({ nullable: false, default: TicketStatus.NOVO })
  status!: TicketStatus;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;
}
