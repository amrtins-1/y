import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConsultancyRequest } from '../entities/consultancy-request.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class ConsultancyRequestService extends AbstractCrudService<ConsultancyRequest, string> {
  constructor(@InjectRepository(ConsultancyRequest) repository: Repository<ConsultancyRequest>) {
    super(repository);
  }

  protected setId(entity: ConsultancyRequest, id: string): void {
    entity.id = id;
  }
}
