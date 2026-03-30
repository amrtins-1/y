package com.instituto.api.controller;

import com.instituto.api.model.UserSubscription;
import com.instituto.api.service.UserSubscriptionService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/user-subscriptions")
public class UserSubscriptionController extends AbstractCrudController<UserSubscription, UUID> {

    public UserSubscriptionController(UserSubscriptionService service) {
        super(service);
    }
}
