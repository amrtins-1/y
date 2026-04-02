import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Exclude } from 'class-transformer';
import { AuditableEntity } from './auditable.entity';
import { UserRole } from './enums';

@Entity({ name: 'app_user' })
export class AppUser extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @IsNotEmpty()
  @Column({ name: 'full_name', nullable: false })
  fullName!: string;

  @IsNotEmpty()
  @IsEmail()
  @Column({ nullable: false, unique: true })
  email!: string;

  @IsOptional()
  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @IsOptional()
  @Column({ type: 'varchar', nullable: true, unique: true })
  cpf?: string | null;

  @IsNotEmpty()
  @Exclude()
  @Column({ name: 'password_hash', nullable: false })
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: false })
  role: UserRole = UserRole.MEMBER;

  @Column({ name: 'preferred_lang', type: 'varchar', nullable: true, default: 'pt' })
  preferredLang?: string | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;
}
