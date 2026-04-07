import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { NewsletterSubscriber } from '../entities/newsletter-subscriber.entity';
import { NewsletterSubscriberService } from '../services/newsletter-subscriber.service';
import { STRICT_BODY_VALIDATION_PIPE } from '../validation/strict-body-validation.pipe';

@Controller('api/newsletter-subscribers')
export class NewsletterSubscriberController extends GenericCrudController<NewsletterSubscriber, string> {
  constructor(service: NewsletterSubscriberService) {
    super(service);
  }

  @Post()
  @UsePipes(STRICT_BODY_VALIDATION_PIPE)
  override create(@Body() body: NewsletterSubscriber): Promise<NewsletterSubscriber> {
    return super.create(body);
  }
}
