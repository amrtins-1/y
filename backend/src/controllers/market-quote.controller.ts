import { Body, Controller, Delete, Get, HttpCode, Param, Put } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { MarketQuote } from '../entities/market-quote.entity';
import { MarketQuoteService } from '../services/market-quote.service';

@Controller('api/market-quotes')
export class MarketQuoteController extends GenericCrudController<MarketQuote, number> {
  constructor(service: MarketQuoteService) {
    super(service);
  }

  @Get(':id')
  override getById(@Param('id') id: string): Promise<MarketQuote> {
    return this.service.findById(Number(id));
  }

  @Put(':id')
  override update(@Param('id') id: string, @Body() body: MarketQuote): Promise<MarketQuote> {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  @HttpCode(204)
  override async remove(@Param('id') id: string): Promise<void> {
    await this.service.delete(Number(id));
  }
}
