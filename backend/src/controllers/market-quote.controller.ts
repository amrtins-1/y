import { Body, Controller, Delete, Get, HttpCode, Param, Put, ParseIntPipe } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { MarketQuote } from '../entities/market-quote.entity';
import { MarketQuoteService } from '../services/market-quote.service';

@Controller('api/market-quotes')
export class MarketQuoteController extends GenericCrudController<MarketQuote, number> {
  constructor(service: MarketQuoteService) {
    super(service);
  }

  @Get(':id')
  override getById(@Param('id', ParseIntPipe) id: number): Promise<MarketQuote> {
    return this.service.findById(id);
  }

  @Put(':id')
  override update(@Param('id', ParseIntPipe) id: number, @Body() body: MarketQuote): Promise<MarketQuote> {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  override async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.delete(id);
  }
}
