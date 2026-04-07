import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { ContactMessage } from '../entities/contact-message.entity';
import { ContactMessageService } from '../services/contact-message.service';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';

@Controller('api/contact-messages')
export class ContactMessageController extends GenericCrudController<ContactMessage, string> {
  constructor(service: ContactMessageService) {
    super(service);
  }

  @Post()
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  override create(@Body() body: ContactMessage): Promise<ContactMessage> {
    return super.create(body);
  }
}
