import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAddress } from '../entities/user-address.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class UserAddressService extends AbstractCrudService<UserAddress, string> {
  constructor(@InjectRepository(UserAddress) repository: Repository<UserAddress>) {
    super(repository);
  }

  protected setId(entity: UserAddress, id: string): void {
    entity.id = id;
  }
}
