import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketAsset } from '../entities/market-asset.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class MarketAssetService extends AbstractCrudService<MarketAsset, string> {
  constructor(@InjectRepository(MarketAsset) repository: Repository<MarketAsset>) {
    super(repository);
  }

  protected setId(entity: MarketAsset, id: string): void {
    entity.id = id;
  }
}
