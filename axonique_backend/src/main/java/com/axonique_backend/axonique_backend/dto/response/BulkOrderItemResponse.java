package com.axonique_backend.axonique_backend.dto.response;

import java.math.BigDecimal;
import lombok.Builder;
import lombok.Data;

/**
 * BulkOrderItemResponse — represents a line item in a bulk order.
 */
@Data
@Builder
public class BulkOrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String size;
    private int quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountPercentage;
    private BigDecimal lineTotal;
}
