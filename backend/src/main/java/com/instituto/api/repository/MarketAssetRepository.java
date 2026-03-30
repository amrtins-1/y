package com.instituto.api.repository;

import com.instituto.api.model.MarketAsset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MarketAssetRepository extends JpaRepository<MarketAsset, UUID> {}
