package com.axonique_backend.axonique_backend.mapper;

import org.springframework.stereotype.Component;

import com.axonique_backend.axonique_backend.dto.request.ProductRequest;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.model.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class ProductMapper {

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

        // Individual item discount
        product.setDiscountActive(request.isDiscountActive());
        product.setDiscountPercentage(
                request.getDiscountPercentage() != null
                        ? request.getDiscountPercentage()
                        : BigDecimal.ZERO
        );

        return product;
    }

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

        // Individual item discount
        product.setDiscountActive(request.isDiscountActive());
        product.setDiscountPercentage(
                request.getDiscountPercentage() != null
                        ? request.getDiscountPercentage()
                        : BigDecimal.ZERO
        );
    }

    public ProductResponse toResponse(Product product) {

        BigDecimal originalPrice = product.getPrice();
        BigDecimal discountPercentage = product.getDiscountPercentage() != null
                ? product.getDiscountPercentage()
                : BigDecimal.ZERO;

        boolean discountActive = product.isDiscountActive();

        BigDecimal discountedPrice = originalPrice;

        // CORE LOGIC (Task 2)
        if (discountActive && discountPercentage.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountAmount = originalPrice
                    .multiply(discountPercentage)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            discountedPrice = originalPrice.subtract(discountAmount);
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .category(product.getCategory())
                .price(originalPrice)
                .discountPercentage(discountPercentage)
                .discountActive(discountActive)
                .discountedPrice(discountedPrice)
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