import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'video_item' })
@Unique(['platform', 'externalId'])
export class VideoItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true, default: 'youtube' })
  platform?: string | null;

  @Column({ name: 'external_id', nullable: false })
  externalId!: string;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: false })
  url!: string;

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl?: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'is_active', nullable: false, default: true })
  isActive!: boolean;

  @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  lastSyncedAt!: Date;
}
