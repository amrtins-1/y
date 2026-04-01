import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { NewsletterSubscriber } from '../entities/newsletter-subscriber.entity';
import { NewsletterSubscriberService } from '../services/newsletter-subscriber.service';

@Controller('api/newsletter-subscribers')
export class NewsletterSubscriberController extends GenericCrudController<NewsletterSubscriber, string> {
  constructor(service: NewsletterSubscriberService) {
    super(service);
  }
}
