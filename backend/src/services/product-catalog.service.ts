import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCatalog } from '../entities/product-catalog.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class ProductCatalogService extends AbstractCrudService<ProductCatalog, string> {
  constructor(@InjectRepository(ProductCatalog) repository: Repository<ProductCatalog>) {
    super(repository);
  }

  protected setId(entity: ProductCatalog, id: string): void {
    entity.id = id;
  }
}
