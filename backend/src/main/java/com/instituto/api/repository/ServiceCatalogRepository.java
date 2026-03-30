package com.instituto.api.repository;

import com.instituto.api.model.ServiceCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ServiceCatalogRepository extends JpaRepository<ServiceCatalog, UUID> {}
