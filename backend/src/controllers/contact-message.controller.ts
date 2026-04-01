import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { ContactMessage } from '../entities/contact-message.entity';
import { ContactMessageService } from '../services/contact-message.service';

@Controller('api/contact-messages')
export class ContactMessageController extends GenericCrudController<ContactMessage, string> {
  constructor(service: ContactMessageService) {
    super(service);
  }
}
