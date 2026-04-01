import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlan } from '../entities/membership-plan.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class MembershipPlanService extends AbstractCrudService<MembershipPlan, string> {
  constructor(@InjectRepository(MembershipPlan) repository: Repository<MembershipPlan>) {
    super(repository);
  }

  protected setId(entity: MembershipPlan, id: string): void {
    entity.id = id;
  }
}
