package com.instituto.api.controller;

import com.instituto.api.model.ServiceCatalog;
import com.instituto.api.service.ServiceCatalogService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/services")
public class ServiceCatalogController extends AbstractCrudController<ServiceCatalog, UUID> {

    public ServiceCatalogController(ServiceCatalogService service) {
        super(service);
    }
}
