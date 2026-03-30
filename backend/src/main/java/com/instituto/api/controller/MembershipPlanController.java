package com.instituto.api.controller;

import com.instituto.api.model.MembershipPlan;
import com.instituto.api.service.MembershipPlanService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/membership-plans")
public class MembershipPlanController extends AbstractCrudController<MembershipPlan, UUID> {

    public MembershipPlanController(MembershipPlanService service) {
        super(service);
    }
}
