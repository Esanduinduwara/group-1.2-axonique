package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.request.ClientProductSyncItemRequest;
import com.axonique_backend.axonique_backend.dto.request.ClientProductSyncRequest;
import com.axonique_backend.axonique_backend.dto.response.ClientProductSyncResponse;
import com.axonique_backend.axonique_backend.model.Product;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.service.interfaces.ClientProductSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientProductSyncServiceImpl implements ClientProductSyncService {

    private final ProductRepository productRepository;

    @Override
    public ClientProductSyncResponse synchronize(ClientProductSyncRequest request) {
        ClientProductSyncResponse response = ClientProductSyncResponse.builder().build();

        if (request == null || request.getProducts() == null || request.getProducts().isEmpty()) {
            response.getMessages().add("No client product data provided.");
            return response;
        }

        response.setTotalReceived(request.getProducts().size());

        for (ClientProductSyncItemRequest item : request.getProducts()) {
            try {
                if (item.getExternalId() == null || item.getExternalId().isBlank()) {
                    response.setFailed(response.getFailed() + 1);
                    response.getMessages().add("Skipped record with missing externalId.");
                    continue;
                }

                Product existing = productRepository.findByExternalId(item.getExternalId()).orElse(null);

                if (existing == null) {
                    Product created = new Product();
                    mapFields(created, item);
                    created.setExternalId(item.getExternalId());
                    created.setSourceSystem(item.getSourceSystem());
                    created.setLastSyncedAt(LocalDateTime.now());
                    created.setSyncVersion(item.getSyncVersion() != null ? item.getSyncVersion() : 1L);

                    productRepository.saveAndFlush(created);

                    response.setInserted(response.getInserted() + 1);
                    response.getMessages().add("Inserted product: " + item.getExternalId());
                } else {
                    Long incomingVersion = item.getSyncVersion() != null ? item.getSyncVersion() : 0L;
                    Long existingVersion = existing.getSyncVersion() != null ? existing.getSyncVersion() : 0L;

                    if (incomingVersion < existingVersion) {
                        response.setSkipped(response.getSkipped() + 1);
                        response.getMessages().add("Skipped outdated record: " + item.getExternalId());
                        continue;
                    }

                    mapFields(existing, item);
                    existing.setSourceSystem(item.getSourceSystem());
                    existing.setLastSyncedAt(LocalDateTime.now());
                    existing.setSyncVersion(incomingVersion);

                    productRepository.saveAndFlush(existing);

                    response.setUpdated(response.getUpdated() + 1);
                    response.getMessages().add("Updated product: " + item.getExternalId());
                }

            } catch (Exception e) {
                response.setFailed(response.getFailed() + 1);
                response.getMessages().add("Failed product: " + item.getExternalId() + " - " + e.getMessage());
                log.error("Product sync failed for externalId={}", item.getExternalId(), e);
            }
        }

        return response;
    }

    private void mapFields(Product product, ClientProductSyncItemRequest item) {
        product.setName(item.getName());
        product.setCategory(item.getCategory());
        product.setPrice(item.getPrice());
        product.setDescription(item.getDescription());
        product.setEmoji(item.getEmoji());
        product.setBadge(item.getBadge());
        product.setImageUrl(item.getImageUrl());
        product.setInStock(item.getInStock() != null ? item.getInStock() : true);
        product.setStockQuantity(item.getStockQuantity() != null ? item.getStockQuantity() : 0);
        product.setLowStockThreshold(item.getLowStockThreshold() != null ? item.getLowStockThreshold() : 5);
        product.setDeleted(false);

        product.setDiscountActive(false);
        product.setDiscountPercentage(BigDecimal.ZERO);

        if (item.getSizes() != null && !item.getSizes().isEmpty()) {
            product.setSizes(item.getSizes());
        } else {
            product.setSizes(List.of("M"));
        }
    }
}