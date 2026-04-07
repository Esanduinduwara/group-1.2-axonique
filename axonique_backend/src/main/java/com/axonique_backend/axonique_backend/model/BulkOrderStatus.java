package com.axonique_backend.axonique_backend.model;

/**
 * BulkOrderStatus — lifecycle states for a retailer's bulk order.
 *
 * Kept separate from OrderStatus so that each domain can evolve
 * independently (SOLID O — open for extension without modifying OrderStatus).
 */
public enum BulkOrderStatus {
    PENDING,
    CONFIRMED,
    SHIPPED,
    DELIVERED,
    CANCELLED
}