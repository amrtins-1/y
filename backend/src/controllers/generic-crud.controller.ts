import { Body, Delete, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import { CrudService } from '../services/crud.service';

export abstract class GenericCrudController<T, ID> {
  protected constructor(protected readonly service: CrudService<T, ID>) {}

  @Get()
  list(): Promise<T[]> {
    return this.service.findAll();
  }

  @Get(':id')
  getById(@Param('id') id: ID): Promise<T> {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() body: T): Promise<T> {
    return this.service.create(body);
  }

  @Put(':id')
  update(@Param('id') id: ID, @Body() body: T): Promise<T> {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: ID): Promise<void> {
    await this.service.delete(id);
  }
}
