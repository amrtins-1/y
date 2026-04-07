import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { AuditableEntity } from './auditable.entity';
import { AppUser } from './app-user.entity';
import { ConsultationConflictStatus, TicketStatus } from './enums';

@Entity({ name: 'consultancy_request' })
export class ConsultancyRequest extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { nullable: true, eager: true })
  @JoinColumn({ name: 'user_id' })
  user?: AppUser | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  @Column({ name: 'requester_name', nullable: false })
  requesterName!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(180)
  @Column({ name: 'requester_email', nullable: false })
  requesterEmail!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  @Matches(/^[0-9()+\-\s]{10,40}$/)
  @Column({ name: 'requester_phone', nullable: false })
  requesterPhone!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(180)
  @Column({ name: 'farm_name', nullable: false })
  farmName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Column({ type: 'varchar', nullable: true, default: 'Brasil' })
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

  @IsEnum(ConsultationConflictStatus)
  @Column({ name: 'conflict_status', nullable: false })
  conflictStatus!: ConsultationConflictStatus;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  @Column({ name: 'involved_group', nullable: false })
  involvedGroup!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(8000)
  @Column({ name: 'case_report', type: 'text', nullable: false })
  caseReport!: string;

  @Column({ nullable: false, default: TicketStatus.NOVO })
  status!: TicketStatus;
}
