import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AppUser } from './app-user.entity';

@Entity({ name: 'auth_session' })
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;

  @Column({ name: 'refresh_token_hash', nullable: false })
  refreshTokenHash!: string;

  @Column({ name: 'remember_me', nullable: false, default: false })
  rememberMe!: boolean;

  @Column({ type: 'varchar', nullable: true })
  ip?: string | null;

  @Column({ name: 'user_agent', type: 'varchar', nullable: true })
  userAgent?: string | null;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date | null;
}
