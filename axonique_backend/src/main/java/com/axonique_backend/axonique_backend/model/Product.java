package com.axonique_backend.axonique_backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Product — core domain entity for catalogue items.
 *
 *  - Encapsulation: all fields private, accessed via Lombok getters/setters
 *  - Inheritance: extends BaseEntity (id, audit timestamps)
 *
 * SOLID S: only represents product data — no business logic here.
 */
@Entity
@Table(name = "products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product extends BaseEntity {

    @NotBlank(message = "Product name is required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Category is required")
    @Column(nullable = false)
    private String category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "discount_pct", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "discount_active", nullable = false)
    @Builder.Default
    private boolean discountActive = false;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Emoji used as placeholder image in the frontend */
    private String emoji;

    /** e.g. "New", "Featured", "Limited", or null */
    private String badge;

    /** Image URL for the product (replaces emoji display) */
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "in_stock", nullable = false)
    @Builder.Default
    private boolean inStock = true;

    /**
     * Sizes stored as a comma-separated string.
     * Example: "XS,S,M,L,XL,XXL" or "One Size"
     *
     * OOP Encapsulation: getter/setter convert to/from List<String>
     */
    @Column(name = "sizes_raw", nullable = false)
    private String sizesRaw;

    /** Inventory management fields */
    @Column(name = "stock_quantity", nullable = false)
    @Builder.Default
    private Integer stockQuantity = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    @Builder.Default
    private Integer lowStockThreshold = 5;

    // ----- Client Sync Fields -----

    @Column(name = "external_id", unique = true, length = 100)
    private String externalId;

    @Column(name = "source_system", length = 100)
    private String sourceSystem;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @Column(name = "sync_version")
    private Long syncVersion;

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    // ----- Computed helpers (no persistence) -----

    @Transient
    public List<String> getSizes() {
        if (sizesRaw == null || sizesRaw.isBlank()) return new ArrayList<>();
        return List.of(sizesRaw.split(","));
    }

    public void setSizes(List<String> sizes) {
        this.sizesRaw = String.join(",", sizes);
    }

    @Transient
    public boolean isLowStock() {
        return stockQuantity <= lowStockThreshold;
    }
}
