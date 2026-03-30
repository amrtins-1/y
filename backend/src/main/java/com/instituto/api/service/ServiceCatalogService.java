package com.instituto.api.service;

import com.instituto.api.model.ServiceCatalog;
import com.instituto.api.repository.ServiceCatalogRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class ServiceCatalogService extends AbstractCrudService<ServiceCatalog, UUID> {

    public ServiceCatalogService(ServiceCatalogRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(ServiceCatalog entity, UUID id) {
        entity.setId(id);
    }
}
