import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MarketAsset } from './market-asset.entity';
import { QuoteDirection } from './enums';

@Entity({ name: 'market_quote' })
export class MarketQuote {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => MarketAsset, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  asset!: MarketAsset;

  @Column({ name: 'quoted_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  quotedAt!: Date;

  @Column({ type: 'numeric', precision: 38, scale: 6, nullable: false })
  price!: string;

  @Column({ name: 'variation_pct', type: 'numeric', precision: 38, scale: 6, nullable: true })
  variationPct?: string | null;

  @Column({ nullable: false, default: QuoteDirection.UNKNOWN })
  direction!: QuoteDirection;

  @Column({ type: 'varchar', nullable: true })
  source?: string | null;
}
