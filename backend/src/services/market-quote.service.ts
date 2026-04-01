import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketQuote } from '../entities/market-quote.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class MarketQuoteService extends AbstractCrudService<MarketQuote, number> {
  constructor(@InjectRepository(MarketQuote) repository: Repository<MarketQuote>) {
    super(repository);
  }

  protected setId(entity: MarketQuote, id: number): void {
    entity.id = id;
  }
}
