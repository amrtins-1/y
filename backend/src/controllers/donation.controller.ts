import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { Donation } from '../entities/donation.entity';
import { DonationService } from '../services/donation.service';

@Controller('api/donations')
export class DonationController extends GenericCrudController<Donation, string> {
  constructor(service: DonationService) {
    super(service);
  }
}
