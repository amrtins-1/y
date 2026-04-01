import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { AppUser } from './app-user.entity';
import { MarketAsset } from './market-asset.entity';

@Entity({ name: 'user_market_watchlist' })
@Unique(['user', 'asset'])
export class UserMarketWatchlist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => AppUser, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user!: AppUser;

  @ManyToOne(() => MarketAsset, { eager: true })
  @JoinColumn({ name: 'asset_id' })
  asset!: MarketAsset;

  @Column({ name: 'created_at', type: 'timestamptz', nullable: false, default: () => 'now()' })
  createdAt!: Date;
}
