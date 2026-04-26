package com.axonique_backend.axonique_backend.service.interfaces;

import com.axonique_backend.axonique_backend.dto.request.InventoryUpdateRequest;

public interface InventoryService {
    void deductStockFromSale(Long productId, String variant, Integer quantity, String orderId);
    void manualUpdateStock(Long productId, String variant, InventoryUpdateRequest request);
    void checkLowStockAlert(Long productId, String variant, Integer currentQuantity);
}