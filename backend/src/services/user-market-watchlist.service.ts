import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMarketWatchlist } from '../entities/user-market-watchlist.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class UserMarketWatchlistService extends AbstractCrudService<UserMarketWatchlist, string> {
  constructor(@InjectRepository(UserMarketWatchlist) repository: Repository<UserMarketWatchlist>) {
    super(repository);
  }

  protected setId(entity: UserMarketWatchlist, id: string): void {
    entity.id = id;
  }
}
