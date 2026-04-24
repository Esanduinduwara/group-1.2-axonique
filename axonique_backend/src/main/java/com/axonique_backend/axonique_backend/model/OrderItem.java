package com.axonique_backend.axonique_backend.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * OrderItem — a single line item inside an Order.
 *
 *  - Inheritance: extends BaseEntity
 *  - Composition: belongs to Order, references Product by snapshot data
 *
 * Note: We store productName and price as a SNAPSHOT at time of order,
 *       so historical orders remain correct even if Product changes later.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    @NotBlank
    @Column(nullable = false)
    private String productName;

    @NotBlank
    @Column(nullable = false)
    private String selectedSize;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;

    public static OrderItem from(Product product, String size, int qty) {
        BigDecimal originalPrice = product.getPrice();
        BigDecimal finalPrice = originalPrice;

        if (product.isDiscountActive()
                && product.getDiscountPercentage() != null
                && product.getDiscountPercentage().compareTo(BigDecimal.ZERO) > 0) {

            BigDecimal discountAmount = originalPrice
                    .multiply(product.getDiscountPercentage())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            finalPrice = originalPrice.subtract(discountAmount);
        }

        return OrderItem.builder()
                .product(product)
                .productName(product.getName())
                .selectedSize(size)
                .quantity(qty)
                .unitPrice(finalPrice)
                .lineTotal(finalPrice.multiply(BigDecimal.valueOf(qty)))
                .build();
    }
}