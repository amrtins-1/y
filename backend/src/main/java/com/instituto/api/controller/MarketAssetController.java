package com.instituto.api.controller;

import com.instituto.api.model.MarketAsset;
import com.instituto.api.service.MarketAssetService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/market-assets")
public class MarketAssetController extends AbstractCrudController<MarketAsset, UUID> {

    public MarketAssetController(MarketAssetService service) {
        super(service);
    }
}
