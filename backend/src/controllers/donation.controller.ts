import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { Donation } from '../entities/donation.entity';
import { DonationService } from '../services/donation.service';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';

@Controller('api/donations')
export class DonationController extends GenericCrudController<Donation, string> {
  constructor(service: DonationService) {
    super(service);
  }

  @Post()
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  override create(@Body() body: Donation): Promise<Donation> {
    return super.create(body);
  }
}
