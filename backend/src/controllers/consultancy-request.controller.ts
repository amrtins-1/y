import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { ConsultancyRequest } from '../entities/consultancy-request.entity';
import { ConsultancyRequestService } from '../services/consultancy-request.service';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';

@Controller('api/consultancy-requests')
export class ConsultancyRequestController extends GenericCrudController<ConsultancyRequest, string> {
  constructor(service: ConsultancyRequestService) {
    super(service);
  }

  @Post()
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  override create(@Body() body: ConsultancyRequest): Promise<ConsultancyRequest> {
    return super.create(body);
  }
}
