import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSubscription } from '../entities/user-subscription.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class UserSubscriptionService extends AbstractCrudService<UserSubscription, string> {
  constructor(@InjectRepository(UserSubscription) repository: Repository<UserSubscription>) {
    super(repository);
  }

  protected setId(entity: UserSubscription, id: string): void {
    entity.id = id;
  }
}
