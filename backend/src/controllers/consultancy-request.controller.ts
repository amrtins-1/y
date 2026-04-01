import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { ConsultancyRequest } from '../entities/consultancy-request.entity';
import { ConsultancyRequestService } from '../services/consultancy-request.service';

@Controller('api/consultancy-requests')
export class ConsultancyRequestController extends GenericCrudController<ConsultancyRequest, string> {
  constructor(service: ConsultancyRequestService) {
    super(service);
  }
}
