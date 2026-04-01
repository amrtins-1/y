import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { ServiceCatalog } from '../entities/service-catalog.entity';
import { ServiceCatalogService } from '../services/service-catalog.service';

@Controller('api/services')
export class ServiceCatalogController extends GenericCrudController<ServiceCatalog, string> {
  constructor(service: ServiceCatalogService) {
    super(service);
  }
}
