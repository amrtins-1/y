import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'news_article' })
export class NewsArticle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: false })
  title!: string;

  @Column({ nullable: true })
  source?: string | null;

  @Column({ name: 'source_url', nullable: false, unique: true })
  sourceUrl!: string;

  @Column({ type: 'text', nullable: true })
  summary?: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date | null;

  @Column({ name: 'fetched_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  fetchedAt!: Date;
}
