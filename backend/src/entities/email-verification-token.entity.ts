import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AppUser } from './app-user.entity';

@Entity({ name: 'email_verification_token' })
export class EmailVerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;

  @Column({ name: 'token_hash', nullable: false, unique: true })
  tokenHash!: string;

  @Column({ name: 'code_hash', nullable: false })
  codeHash!: string;

  @Column({ name: 'code_salt', nullable: false })
  codeSalt!: string;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt?: Date | null;
}
