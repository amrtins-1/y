import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCatalog } from '../entities/service-catalog.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class ServiceCatalogService extends AbstractCrudService<ServiceCatalog, string> {
  constructor(@InjectRepository(ServiceCatalog) repository: Repository<ServiceCatalog>) {
    super(repository);
  }

  protected setId(entity: ServiceCatalog, id: string): void {
    entity.id = id;
  }
}
