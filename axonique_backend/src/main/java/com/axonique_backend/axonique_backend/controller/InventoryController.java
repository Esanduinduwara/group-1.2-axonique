package com.axonique_backend.axonique_backend.controller;

import com.axonique_backend.axonique_backend.dto.request.InventoryUpdateRequest;
import com.axonique_backend.axonique_backend.service.interfaces.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PatchMapping("/{productId}/variants/{variant}")
    public ResponseEntity<String> updateStock(@PathVariable Long productId, @PathVariable String variant, @RequestBody InventoryUpdateRequest request) {
        inventoryService.manualUpdateStock(productId, variant, request);
        return ResponseEntity.ok("Stock updated successfully");
    }
}