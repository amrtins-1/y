package com.instituto.api.service;

import com.instituto.api.model.MarketQuote;
import com.instituto.api.repository.MarketQuoteRepository;
import org.springframework.stereotype.Service;


@Service
public class MarketQuoteService extends AbstractCrudService<MarketQuote, Long> {

    public MarketQuoteService(MarketQuoteRepository repository) {
        super(repository);
    }

    @Override
    protected void setId(MarketQuote entity, Long id) {
        entity.setId(id);
    }
}
