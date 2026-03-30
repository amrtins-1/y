package com.instituto.api.repository;

import com.instituto.api.model.MarketQuote;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketQuoteRepository extends JpaRepository<MarketQuote, Long> {}
