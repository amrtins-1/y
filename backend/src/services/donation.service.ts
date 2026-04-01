import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Donation } from '../entities/donation.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class DonationService extends AbstractCrudService<Donation, string> {
  constructor(@InjectRepository(Donation) repository: Repository<Donation>) {
    super(repository);
  }

  protected setId(entity: Donation, id: string): void {
    entity.id = id;
  }
}
