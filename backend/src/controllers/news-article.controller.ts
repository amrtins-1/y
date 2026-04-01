import { Controller } from '@nestjs/common';
import { GenericCrudController } from './generic-crud.controller';
import { NewsArticle } from '../entities/news-article.entity';
import { NewsArticleService } from '../services/news-article.service';

@Controller('api/news-articles')
export class NewsArticleController extends GenericCrudController<NewsArticle, string> {
  constructor(service: NewsArticleService) {
    super(service);
  }
}
