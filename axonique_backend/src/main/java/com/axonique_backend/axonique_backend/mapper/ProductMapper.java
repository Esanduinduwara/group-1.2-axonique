package com.axonique_backend.axonique_backend.mapper;

import org.springframework.stereotype.Component;

import com.axonique_backend.axonique_backend.dto.request.ProductRequest;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.model.Product;

/**
 * converts between Product domain model and DTOs.
 *
 * SOLID S (Single Responsibility): mapping is its own concern.
 * SOLID D (Dependency Inversion): controllers and services depend on this
 *   abstraction, keeping domain models out of the HTTP layer.
 *
 *Encapsulation: hides the mapping logic from callers.
 */
@Component
public class ProductMapper {

    /**
     * Convert a ProductRequest (inbound) → Product entity.
     */
    public Product toEntity(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setDescription(request.getDescription());
        product.setEmoji(request.getEmoji());
        product.setBadge(request.getBadge());
        product.setImageUrl(request.getImageUrl());
        product.setInStock(request.isInStock());
        product.setSizes(request.getSizes());
        product.setStockQuantity(request.getStockQuantity());
        product.setLowStockThreshold(request.getLowStockThreshold());
        return product;
    }

    /**
     * Update an existing Product entity from a ProductRequest.
     * OOP: mutates the entity in place rather than creating a new one,
     *      preserving the JPA-managed identity.
     */
    public void updateEntity(Product product, ProductRequest request) {
        product.setName(request.getName());
        product.setCategory(request.getCategory());
        product.setPrice(request.getPrice());
        product.setDescription(request.getDescription());
        product.setEmoji(request.getEmoji());
        product.setBadge(request.getBadge());
        product.setImageUrl(request.getImageUrl());
        product.setInStock(request.isInStock());
        product.setSizes(request.getSizes());
        product.setStockQuantity(request.getStockQuantity());
        product.setLowStockThreshold(request.getLowStockThreshold());
    }

    /**
     * Convert a Product entity → ProductResponse (outbound).
     */
    public ProductResponse toResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .category(product.getCategory())
                .price(product.getPrice())
                .description(product.getDescription())
                .emoji(product.getEmoji())
                .badge(product.getBadge())
                .imageUrl(product.getImageUrl())
                .inStock(product.isInStock())
                .sizes(product.getSizes())
                .createdAt(product.getCreatedAt())
                .stockQuantity(product.getStockQuantity())
                .lowStockThreshold(product.getLowStockThreshold())
                .lowStock(product.isLowStock())
                .build();
    }
}