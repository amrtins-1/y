package com.instituto.api.repository;

import com.instituto.api.model.ProductCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ProductCatalogRepository extends JpaRepository<ProductCatalog, UUID> {}
