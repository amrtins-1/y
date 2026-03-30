package com.instituto.api.service;

import com.instituto.api.model.MembershipPlan;
import com.instituto.api.repository.MembershipPlanRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class MembershipPlanService extends AbstractCrudService<MembershipPlan, UUID> {

    public MembershipPlanService(MembershipPlanRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(MembershipPlan entity, UUID id) {
        entity.setId(id);
    }
}
