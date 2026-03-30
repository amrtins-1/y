package com.instituto.api.controller;

import com.instituto.api.model.UserMarketWatchlist;
import com.instituto.api.service.UserMarketWatchlistService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.UUID;

@RestController
@RequestMapping("/api/market-watchlist")
public class UserMarketWatchlistController extends AbstractCrudController<UserMarketWatchlist, UUID> {

    public UserMarketWatchlistController(UserMarketWatchlistService service) {
        super(service);
    }
}
