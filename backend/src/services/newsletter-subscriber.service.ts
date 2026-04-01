import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsletterSubscriber } from '../entities/newsletter-subscriber.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class NewsletterSubscriberService extends AbstractCrudService<NewsletterSubscriber, string> {
  constructor(@InjectRepository(NewsletterSubscriber) repository: Repository<NewsletterSubscriber>) {
    super(repository);
  }

  protected setId(entity: NewsletterSubscriber, id: string): void {
    entity.id = id;
  }
}
