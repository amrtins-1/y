package com.instituto.api.service;

import com.instituto.api.model.ProductCatalog;
import com.instituto.api.repository.ProductCatalogRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class ProductCatalogService extends AbstractCrudService<ProductCatalog, UUID> {

    public ProductCatalogService(ProductCatalogRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(ProductCatalog entity, UUID id) {
        entity.setId(id);
    }
}
