package com.instituto.api.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "market_asset")
public class MarketAsset extends AuditableEntity {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String category;

    private String section;

    @Column(nullable = false)
    private String label;

    private String reference;
    private String unit;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getSection() { return section; }
    public void setSection(String section) { this.section = section; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean active) { isActive = active; }
}
