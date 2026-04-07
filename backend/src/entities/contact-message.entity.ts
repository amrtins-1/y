import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AppUser } from './app-user.entity';
import { TicketStatus } from './enums';

@Entity({ name: 'contact_message' })
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user?: AppUser | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  @Column({ nullable: false })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(180)
  @Column({ nullable: false })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9()+\-\s]{10,40}$/)
  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  @Column({ nullable: false })
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(5000)
  @Column({ type: 'text', nullable: false })
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Column({ type: 'varchar', nullable: true })
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Column({ type: 'varchar', nullable: true })
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Column({ type: 'varchar', nullable: true })
  city?: string | null;

  @IsBoolean()
  @Column({ name: 'is_manual_location', nullable: false, default: false })
  isManualLocation!: boolean;

  @IsBoolean()
  @Column({ name: 'newsletter_opt_in', nullable: false, default: false })
  newsletterOptIn!: boolean;

  @Column({ nullable: false, default: TicketStatus.NOVO })
  status!: TicketStatus;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;
}
