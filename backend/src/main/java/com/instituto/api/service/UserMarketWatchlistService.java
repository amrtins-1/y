package com.instituto.api.service;

import com.instituto.api.model.UserMarketWatchlist;
import com.instituto.api.repository.UserMarketWatchlistRepository;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class UserMarketWatchlistService extends AbstractCrudService<UserMarketWatchlist, UUID> {

    public UserMarketWatchlistService(UserMarketWatchlistRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(UserMarketWatchlist entity, UUID id) {
        entity.setId(id);
    }
}
