import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { IsEmail, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

@Entity({ name: 'newsletter_subscriber' })
export class NewsletterSubscriber {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(180)
  @Column({ nullable: false, unique: true })
  email!: string;

  @IsOptional()
  @MaxLength(120)
  @Column({ type: 'varchar', nullable: true })
  name?: string | null;

  @IsOptional()
  @MaxLength(40)
  @Column({ type: 'varchar', nullable: true, default: 'site' })
  source?: string | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;

  @Column({ name: 'unsubscribed_at', type: 'timestamptz', nullable: true })
  unsubscribedAt?: Date | null;
}
