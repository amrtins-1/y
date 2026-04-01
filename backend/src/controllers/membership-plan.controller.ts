import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { MembershipPlan } from '../entities/membership-plan.entity';
import { MembershipPlanService } from '../services/membership-plan.service';

@Controller('api/membership-plans')
export class MembershipPlanController extends GenericCrudController<MembershipPlan, string> {
  constructor(service: MembershipPlanService) {
    super(service);
  }
}
