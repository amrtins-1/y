import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';

@Entity({ name: 'market_asset' })
export class MarketAsset extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false, unique: true })
  code!: string;

  @Column({ nullable: false })
  category!: string;

  @Column({ type: 'varchar', nullable: true })
  section?: string | null;

  @Column({ nullable: false })
  label!: string;

  @Column({ type: 'varchar', nullable: true })
  reference?: string | null;

  @Column({ type: 'varchar', nullable: true })
  unit?: string | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;
}
