package com.instituto.api.service;

import com.instituto.api.model.NewsArticle;
import com.instituto.api.repository.NewsArticleRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class NewsArticleService extends AbstractCrudService<NewsArticle, UUID> {

    public NewsArticleService(NewsArticleRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(NewsArticle entity, UUID id) {
        entity.setId(id);
    }
}
