import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

@Entity({ name: 'product_catalog' })
export class ProductCatalog extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  category?: string | null;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: true })
  description?: string | null;

  @Column({ name: 'image_url', nullable: true })
  imageUrl?: string | null;

  @Column({ name: 'external_url', nullable: true })
  externalUrl?: string | null;

  @Column({ nullable: true })
  badge?: string | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;
}
