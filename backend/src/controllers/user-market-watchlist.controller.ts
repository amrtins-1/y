import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { UserMarketWatchlist } from '../entities/user-market-watchlist.entity';
import { UserMarketWatchlistService } from '../services/user-market-watchlist.service';

@Controller('api/market-watchlist')
export class UserMarketWatchlistController extends GenericCrudController<UserMarketWatchlist, string> {
  constructor(service: UserMarketWatchlistService) {
    super(service);
  }
}
