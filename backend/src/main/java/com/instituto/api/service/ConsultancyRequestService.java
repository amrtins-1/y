package com.instituto.api.service;

import com.instituto.api.model.ConsultancyRequest;
import com.instituto.api.repository.ConsultancyRequestRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class ConsultancyRequestService extends AbstractCrudService<ConsultancyRequest, UUID> {

    public ConsultancyRequestService(ConsultancyRequestRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(ConsultancyRequest entity, UUID id) {
        entity.setId(id);
    }
}
