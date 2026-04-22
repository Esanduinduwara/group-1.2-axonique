package com.axonique_backend.axonique_backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * represents a single item the customer wants to add.
 *
 * SOLID S: pure data carrier with validation constraints.
 */
@Data
public class CartItemRequest {
    
    @NotNull(message = "Product ID is required")
    private Long productId;

    @NotNull(message = "Size is required")
    private String size;

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity = 1;
}
