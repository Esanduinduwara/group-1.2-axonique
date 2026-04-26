package com.axonique_backend.axonique_backend.dto.request;

import lombok.Data;

@Data
public class InventoryUpdateRequest {
    private Integer quantity;
    private String action; // Expected values: "ADD", "REMOVE", "SET"
    private String reason;
}