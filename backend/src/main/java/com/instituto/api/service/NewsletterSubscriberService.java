package com.instituto.api.service;

import com.instituto.api.model.NewsletterSubscriber;
import com.instituto.api.repository.NewsletterSubscriberRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class NewsletterSubscriberService extends AbstractCrudService<NewsletterSubscriber, UUID> {

    public NewsletterSubscriberService(NewsletterSubscriberRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(NewsletterSubscriber entity, UUID id) {
        entity.setId(id);
    }
}
