package com.axonique_backend.axonique_backend.dto.request;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ClientProductSyncItemRequest {

    private String externalId;
    private String sourceSystem;
    private Long syncVersion;

    private String name;
    private String category;
    private BigDecimal price;
    private String description;
    private String emoji;
    private String badge;
    private String imageUrl;
    private Boolean inStock;
    private List<String> sizes;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
}