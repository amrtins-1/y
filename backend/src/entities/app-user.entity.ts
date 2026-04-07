import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Exclude } from 'class-transformer';
import { AuditableEntity } from './auditable.entity';
import { UserRole } from './enums';

@Entity({ name: 'app_user' })
export class AppUser extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(120)
  @Column({ name: 'full_name', nullable: false })
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(180)
  @Column({ nullable: false, unique: true })
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9()+\-\s]{10,40}$/)
  @Column({ type: 'varchar', nullable: true })
  phone?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^\d{11}$/)
  @Column({ type: 'varchar', nullable: true, unique: true })
  cpf?: string | null;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  @Exclude()
  @Column({ name: 'password_hash', nullable: false })
  passwordHash!: string;

  @IsEnum(UserRole)
  @Column({ type: 'varchar', nullable: false })
  role: UserRole = UserRole.MEMBER;

  @Column({ name: 'preferred_lang', type: 'varchar', nullable: true, default: 'pt' })
  preferredLang?: string | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;
}
