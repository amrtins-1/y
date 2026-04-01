import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { UserSubscription } from '../entities/user-subscription.entity';
import { UserSubscriptionService } from '../services/user-subscription.service';

@Controller('api/user-subscriptions')
export class UserSubscriptionController extends GenericCrudController<UserSubscription, string> {
  constructor(service: UserSubscriptionService) {
    super(service);
  }
}
