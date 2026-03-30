package com.instituto.api.controller;

import com.instituto.api.model.MarketQuote;
import com.instituto.api.service.MarketQuoteService;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/api/market-quotes")
public class MarketQuoteController extends AbstractCrudController<MarketQuote, Long> {

    public MarketQuoteController(MarketQuoteService service) {
        super(service);
    }
}
