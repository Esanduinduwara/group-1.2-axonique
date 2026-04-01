package com.axonique_backend.axonique_backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

/**
 * outbound DTO returned to the frontend.
 *
 * SOLID S: shapes the API response independently of the domain model. Changing the response shape never touches Product.java.
 */
@Data
@Builder
public class ProductResponse {
    private Long id;
    private String name;
    private String category;
    private BigDecimal price;
    @JsonProperty("desc")
    private String description;
    private String emoji;
    private String badge;
    private String imageUrl;
    private boolean inStock;
    private List<String> sizes;
    private LocalDateTime createdAt;
    private int stockQuantity;
    private int lowStockThreshold;
    private boolean lowStock;
}
