package com.instituto.api.model;

import com.instituto.api.model.enums.QuoteDirection;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "market_quote")
public class MarketQuote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "asset_id", nullable = false)
    private MarketAsset asset;

    @Column(name = "quoted_at", nullable = false)
    private Instant quotedAt = Instant.now();

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "variation_pct")
    private BigDecimal variationPct;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private QuoteDirection direction = QuoteDirection.UNKNOWN;

    private String source;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public MarketAsset getAsset() { return asset; }
    public void setAsset(MarketAsset asset) { this.asset = asset; }
    public Instant getQuotedAt() { return quotedAt; }
    public void setQuotedAt(Instant quotedAt) { this.quotedAt = quotedAt; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getVariationPct() { return variationPct; }
    public void setVariationPct(BigDecimal variationPct) { this.variationPct = variationPct; }
    public QuoteDirection getDirection() { return direction; }
    public void setDirection(QuoteDirection direction) { this.direction = direction; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
