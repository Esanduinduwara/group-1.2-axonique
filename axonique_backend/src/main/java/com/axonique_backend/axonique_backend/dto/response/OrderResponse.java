package com.axonique_backend.axonique_backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;
import lombok.Data;

/**
 *outbound DTO for a full order.
 */
@Data
@Builder
public class OrderResponse {
    
    private Long id;
    private String customerName;
    private String customerEmail;
    private String deliveryAddress;
    private BigDecimal subTotal;
    private BigDecimal shippingFee;
    private BigDecimal total;
    private String status;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
}
