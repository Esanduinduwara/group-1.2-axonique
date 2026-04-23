package com.axonique_backend.axonique_backend.model;

import java.math.BigDecimal;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.util.ArrayList;
import java.util.List;
import java.time.LocalDateTime;

/**
 * Order — represents a customer's placed order.
 *
 *  - Inheritance: extends BaseEntity
 *  - Composition: contains a list of OrderItems
 *  - Encapsulation: status transitions guarded by business logic in OrderService
 *
 * SOLID S: holds order data only; status/pricing logic lives in OrderService.
 */
@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order extends BaseEntity {

    @NotBlank(message = "Customer name is required")
    @Column(nullable = false)
    private String customerName;

    @NotBlank(message = "Customer email is required")
    @Column(nullable = false)
    private String customerEmail;

    @NotBlank(message = "Delivery address is required")
    @Column(nullable = false, columnDefinition = "TEXT")
    private String deliveryAddress;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal shippingFee;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @Column(unique = true, length = 128)
    private String verificationToken;

    private LocalDateTime verificationTokenExpiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean verificationTokenUsed = false;

    private LocalDateTime verificationCompletedAt;

    /**
     * OOP Composition: an Order owns its OrderItems.
     * CascadeType.ALL ensures items are persisted / deleted with the order.
     */
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();

    // ----- Helper to maintain bi-directional relationship -----
    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}

