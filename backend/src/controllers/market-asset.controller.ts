import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { MarketAsset } from '../entities/market-asset.entity';
import { MarketAssetService } from '../services/market-asset.service';

@Controller('api/market-assets')
export class MarketAssetController extends GenericCrudController<MarketAsset, string> {
  constructor(service: MarketAssetService) {
    super(service);
  }
}
