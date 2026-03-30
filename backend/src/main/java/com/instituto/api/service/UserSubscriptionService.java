package com.instituto.api.service;

import com.instituto.api.model.UserSubscription;
import com.instituto.api.repository.UserSubscriptionRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class UserSubscriptionService extends AbstractCrudService<UserSubscription, UUID> {

    public UserSubscriptionService(UserSubscriptionRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(UserSubscription entity, UUID id) {
        entity.setId(id);
    }
}
