package com.axonique_backend.axonique_backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Data;

/**
 * BulkOrderResponse — outbound DTO for bulk orders returned to retailers.
 * 
 * Represents a wholesale order placed by a retailer with bulk discount info.
 */
@Data
@Builder
public class BulkOrderResponse {
    private Long id;
    private String ref; // Reference number like BLK-0042
    private String companyName;
    private String contactPerson;
    private String contactEmail;
    private String deliveryAddress;
    private String notes;
    private int itemCount;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal total;
    private String status; // PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BulkOrderItemResponse> items;
}
