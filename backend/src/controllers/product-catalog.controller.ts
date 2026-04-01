import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { ProductCatalog } from '../entities/product-catalog.entity';
import { ProductCatalogService } from '../services/product-catalog.service';

@Controller('api/products')
export class ProductCatalogController extends GenericCrudController<ProductCatalog, string> {
  constructor(service: ProductCatalogService) {
    super(service);
  }
}
