import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { AuditableEntity } from './auditable.entity';
import { AppUser } from './app-user.entity';

@Entity({ name: 'user_address' })
export class UserAddress extends AuditableEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => AppUser, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;

  @Column({ type: 'varchar', nullable: true })
  country?: string | null;

  @Column({ type: 'varchar', nullable: true })
  state?: string | null;

  @Column({ type: 'varchar', nullable: true })
  city?: string | null;

  @Column({ name: 'address_line', type: 'varchar', nullable: true })
  addressLine?: string | null;

  @Column({ name: 'postal_code', type: 'varchar', nullable: true })
  postalCode?: string | null;

  @Column({ name: 'is_manual_location', nullable: false, default: false })
  isManualLocation!: boolean;
}
