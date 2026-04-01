package com.axonique_backend.axonique_backend.model;

import java.math.BigDecimal;

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
 *       This is a deliberate denormalization for data integrity.
 */
@Entity
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem extends BaseEntity {

    /** FK to the parent Order */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    /** FK to Product — used to look up current product; snapshot fields below preserve history */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // ----- Snapshot fields (denormalized for order history integrity) -----

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

    /** Unit price at the time of the order */
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    /** quantity × unitPrice */
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal;

    // ----- Factory method (OOP: encapsulates construction logic) -----
    public static OrderItem from(Product product, String size, int qty) {
        BigDecimal unit = product.getPrice();
        return OrderItem.builder()
                .product(product)
                .productName(product.getName())
                .selectedSize(size)
                .quantity(qty)
                .unitPrice(unit)
                .lineTotal(unit.multiply(BigDecimal.valueOf(qty)))
                .build();
    }
}
