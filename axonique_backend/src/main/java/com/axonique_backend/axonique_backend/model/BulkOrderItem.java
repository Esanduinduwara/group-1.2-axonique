package com.axonique_backend.axonique_backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * BulkOrderItem — one line item inside a BulkOrder.
 *
 * Mirrors OrderItem's snapshot pattern: productName and unitPrice are
 * stored at order-time so historical records remain correct even if the
 * Product is updated or soft-deleted later.
 *
 * SOLID S: holds line-item data only; discount maths lives in the service.
 */
@Entity
@Table(name = "bulk_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BulkOrderItem extends BaseEntity {

    /** FK to parent BulkOrder. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bulk_order_id", nullable = false)
    private BulkOrder bulkOrder;

    /**
     * FK to Product — nullable so a deleted product does not orphan the
     * line item (ON DELETE SET NULL in the DB trigger / FK definition).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    // ----- Snapshot fields (denormalised for order-history integrity) -----

    @NotBlank
    @Column(nullable = false)
    private String productName;

    @Column
    private String productCategory;

    @Column(length = 20)
    private String selectedSize;

    @NotNull
    @Min(1)
    @Column(nullable = false)
    private Integer quantity;

    /** Unit price at order-time, BEFORE any discount. */
    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    /** Discount percentage applied to this line (inherited from the order tier). */
    @NotNull
    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPct = BigDecimal.ZERO;

    /** quantity × unitPrice × (1 − discountPct / 100) */
    @NotNull
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal lineTotal;
}
