import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { UserAddress } from '../entities/user-address.entity';
import { UserAddressService } from '../services/user-address.service';

@Controller('api/user-addresses')
export class UserAddressController extends GenericCrudController<UserAddress, string> {
  constructor(service: UserAddressService) {
    super(service);
  }
}
