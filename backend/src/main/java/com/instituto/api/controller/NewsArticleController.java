package com.instituto.api.controller;

import com.instituto.api.model.NewsArticle;
import com.instituto.api.service.NewsArticleService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/news-articles")
public class NewsArticleController extends AbstractCrudController<NewsArticle, UUID> {

    public NewsArticleController(NewsArticleService service) {
        super(service);
    }
}
