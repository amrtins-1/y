import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsArticle } from '../entities/news-article.entity';
import { AbstractCrudService } from './abstract-crud.service';

@Injectable()
export class NewsArticleService extends AbstractCrudService<NewsArticle, string> {
  constructor(@InjectRepository(NewsArticle) repository: Repository<NewsArticle>) {
    super(repository);
  }

  protected setId(entity: NewsArticle, id: string): void {
    entity.id = id;
  }
}
