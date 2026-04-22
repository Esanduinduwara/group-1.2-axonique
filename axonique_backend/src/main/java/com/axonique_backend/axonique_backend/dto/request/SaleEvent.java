package com.axonique_backend.axonique_backend.dto.request;

import lombok.Data;

@Data
public class SaleEvent {
    private String orderId;
    private Long productId;
    private String variant;
    private Integer quantity;
}