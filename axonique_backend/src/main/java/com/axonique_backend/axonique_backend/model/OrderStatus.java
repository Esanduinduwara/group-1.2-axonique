package com.axonique_backend.axonique_backend.model;

/**
 * OrderStatus — represents the lifecycle of an order.
 *
 * Abstraction: hides raw string comparisons behind a typed enum.
 * SOLID O (Open/Closed): new statuses can be added without touching Order
 * logic.
 */
public enum OrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED
}
