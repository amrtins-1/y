package com.instituto.api.service;

import com.instituto.api.model.MarketAsset;
import com.instituto.api.repository.MarketAssetRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class MarketAssetService extends AbstractCrudService<MarketAsset, UUID> {

    public MarketAssetService(MarketAssetRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(MarketAsset entity, UUID id) {
        entity.setId(id);
    }
}
