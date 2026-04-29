/*

package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.request.SaleEvent;
import com.axonique_backend.axonique_backend.service.interfaces.InventoryService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class InventoryKafkaListener_DISABLED {

    private final InventoryService inventoryService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "sale_finalized", groupId = "inventory-group")
    public void handleSaleFinalized(String message) {
        try {
            SaleEvent event = objectMapper.readValue(message, SaleEvent.class);
            inventoryService.deductStockFromSale(event.getProductId(), event.getVariant(), event.getQuantity(), event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to process sale_finalized event: {}", e.getMessage());
        }
    }
}


*/