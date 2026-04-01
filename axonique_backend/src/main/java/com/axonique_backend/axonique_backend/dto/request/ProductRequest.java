package com.axonique_backend.axonique_backend.dto.request;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

/**
 * DTO for creating or updating a product.
 *
 * SOLID S: only carries inbound data — not the domain model.
 * Encapsulation: validation annotations enforce rules at the boundary.
 */
@Data
public class ProductRequest {
   
    @NotBlank(message = "Product name is required")
    private String name;

    @NotBlank(message = "Category is required")
    private String category;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be positive")
    private BigDecimal price;

    @JsonProperty("desc")
    private String description;

    private String emoji;

    private String badge;

    private String imageUrl;

    @JsonProperty("in_stock")
    private boolean inStock = true;
    
    @NotEmpty(message = "At least one size is required")
    private List<@NotBlank String> sizes;

    private int stockQuantity = 0;

    private int lowStockThreshold = 5;
}
