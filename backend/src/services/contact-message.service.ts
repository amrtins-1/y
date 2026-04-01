import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from '../entities/contact-message.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class ContactMessageService extends AbstractCrudService<ContactMessage, string> {
  constructor(@InjectRepository(ContactMessage) repository: Repository<ContactMessage>) {
    super(repository);
  }

  protected setId(entity: ContactMessage, id: string): void {
    entity.id = id;
  }
}
