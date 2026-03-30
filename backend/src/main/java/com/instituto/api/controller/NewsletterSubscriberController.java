package com.instituto.api.controller;

import com.instituto.api.model.NewsletterSubscriber;
import com.instituto.api.service.NewsletterSubscriberService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/newsletter-subscribers")
public class NewsletterSubscriberController extends AbstractCrudController<NewsletterSubscriber, UUID> {

    public NewsletterSubscriberController(NewsletterSubscriberService service) {
        super(service);
    }
}
