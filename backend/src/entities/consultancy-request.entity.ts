import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
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

  @IsNotEmpty()
  @MaxLength(120)
  @Column({ name: 'requester_name', nullable: false })
  requesterName!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(180)
  @Column({ name: 'requester_email', nullable: false })
  requesterEmail!: string;

  @IsNotEmpty()
  @MaxLength(40)
  @Column({ name: 'requester_phone', nullable: false })
  requesterPhone!: string;

  @IsNotEmpty()
  @MaxLength(180)
  @Column({ name: 'farm_name', nullable: false })
  farmName!: string;

  @IsOptional()
  @MaxLength(100)
  @Column({ type: 'varchar', nullable: true, default: 'Brasil' })
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

  @Column({ name: 'conflict_status', nullable: false })
  conflictStatus!: ConsultationConflictStatus;

  @IsNotEmpty()
  @MaxLength(160)
  @Column({ name: 'involved_group', nullable: false })
  involvedGroup!: string;

  @IsNotEmpty()
  @Column({ name: 'case_report', type: 'text', nullable: false })
  caseReport!: string;

  @Column({ nullable: false, default: TicketStatus.NOVO })
  status!: TicketStatus;
}
