import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

@Entity({ name: 'service_catalog' })
export class ServiceCatalog extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false, unique: true })
  slug!: string;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: true })
  description?: string | null;

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  features!: string | unknown;

  @Column({ name: 'cta_url', nullable: true })
  ctaUrl?: string | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;
}
