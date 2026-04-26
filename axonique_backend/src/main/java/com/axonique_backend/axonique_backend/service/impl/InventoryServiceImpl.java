package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.request.InventoryUpdateRequest;
import com.axonique_backend.axonique_backend.model.Inventory;
import com.axonique_backend.axonique_backend.model.StockHistory;
import com.axonique_backend.axonique_backend.repository.InventoryRepository;
import com.axonique_backend.axonique_backend.repository.StockHistoryRepository;
import com.axonique_backend.axonique_backend.service.interfaces.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final InventoryRepository inventoryRepository;
    private final StockHistoryRepository stockHistoryRepository;
    private static final int LOW_STOCK_THRESHOLD = 10;

    @Override
    @Transactional
    public void deductStockFromSale(Long productId, String variant, Integer quantity, String orderId) {
        Inventory inventory = inventoryRepository.findByProductIdAndVariant(productId, variant)
                .orElseThrow(() -> new RuntimeException("Inventory not found"));

        if (inventory.getQuantity() < quantity) {
            throw new RuntimeException("Insufficient stock for product " + productId + " variant " + variant);
        }

        inventory.setQuantity(inventory.getQuantity() - quantity);
        inventoryRepository.save(inventory);

        logHistory(productId, variant, -quantity, "SALE_DEDUCTION", "Order: " + orderId);
        checkLowStockAlert(productId, variant, inventory.getQuantity());
    }

    @Override
    @Transactional
    public void manualUpdateStock(Long productId, String variant, InventoryUpdateRequest request) {
        Inventory inventory = inventoryRepository.findByProductIdAndVariant(productId, variant)
                .orElseGet(() -> Inventory.builder().productId(productId).variant(variant).quantity(0).build());

        int change = 0;
        if ("ADD".equalsIgnoreCase(request.getAction())) {
            change = request.getQuantity();
            inventory.setQuantity(inventory.getQuantity() + change);
        } else if ("REMOVE".equalsIgnoreCase(request.getAction())) {
            change = -request.getQuantity();
            inventory.setQuantity(inventory.getQuantity() + change);
        }

        inventoryRepository.save(inventory);
        logHistory(productId, variant, change, "MANUAL_" + request.getAction().toUpperCase(), request.getReason());
        checkLowStockAlert(productId, variant, inventory.getQuantity());
    }

    @Override
    public void checkLowStockAlert(Long productId, String variant, Integer currentQuantity) {
        if (currentQuantity <= LOW_STOCK_THRESHOLD) {
            log.warn("LOW STOCK ALERT: Product {} Variant {} has only {} items left!", productId, variant, currentQuantity);
        }
    }

    private void logHistory(Long productId, String variant, Integer quantityChanged, String action, String reason) {
        StockHistory history = StockHistory.builder().productId(productId).variant(variant).quantityChanged(quantityChanged).action(action).reason(reason).timestamp(LocalDateTime.now()).build();
        stockHistoryRepository.save(history);
    }
}