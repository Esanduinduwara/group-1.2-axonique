package com.axonique_backend.axonique_backend.dto.response;

import java.math.BigDecimal;

import lombok.Builder;
import lombok.Data;

/**
 * outbound DTO for a single order line item.
 */
@Data
@Builder
public class OrderItemResponse {
    
    private Long id;
    private Long productId;
    private String productName;
    private String selectedSize;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    
}
