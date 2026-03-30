package com.instituto.api.controller;

import com.instituto.api.model.ProductCatalog;
import com.instituto.api.service.ProductCatalogService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductCatalogController extends AbstractCrudController<ProductCatalog, UUID> {

    public ProductCatalogController(ProductCatalogService service) {
        super(service);
    }
}
