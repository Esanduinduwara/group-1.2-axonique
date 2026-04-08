package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.BulkOrder;
import com.axonique_backend.axonique_backend.model.BulkOrderStatus;
import com.axonique_backend.axonique_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * BulkOrderRepository — data-access layer for BulkOrder entities.
 *
 * SOLID D: BulkOrderService depends on this abstraction, not a concrete DAO.
 * SOLID S: only handles bulk-order persistence queries.
 */
@Repository
public interface BulkOrderRepository extends JpaRepository<BulkOrder, Long> {

    /**
     * Fetch all bulk orders belonging to a given retailer, newest first.
     * Items are eagerly joined in a single query to avoid N+1 selects.
     */
    @Query("""
            SELECT DISTINCT bo FROM BulkOrder bo
            LEFT JOIN FETCH bo.items
            WHERE bo.retailer = :retailer
            ORDER BY bo.createdAt DESC
            """)
    List<BulkOrder> findByRetailerWithItems(@Param("retailer") User retailer);

    /**
     * Fetch a single bulk order by ID, eagerly loading its items.
     * Returns Optional.empty() if the order does not exist.
     */
    @Query("""
            SELECT bo FROM BulkOrder bo
            LEFT JOIN FETCH bo.items i
            LEFT JOIN FETCH i.product
            WHERE bo.id = :id
            """)
    Optional<BulkOrder> findByIdWithItems(@Param("id") Long id);

    /**
     * Fetch all bulk orders for a retailer filtered by status, newest first.
     * Useful for future filtering endpoints.
     */
    @Query("""
            SELECT DISTINCT bo FROM BulkOrder bo
            LEFT JOIN FETCH bo.items
            WHERE bo.retailer = :retailer
              AND bo.status   = :status
            ORDER BY bo.createdAt DESC
            """)
    List<BulkOrder> findByRetailerAndStatusWithItems(
            @Param("retailer") User retailer,
            @Param("status")   BulkOrderStatus status);

    /** All orders across all retailers — for admin use. */
    @Query("""
            SELECT DISTINCT bo FROM BulkOrder bo
            LEFT JOIN FETCH bo.items
            ORDER BY bo.createdAt DESC
            """)
    List<BulkOrder> findAllWithItems();

    /** Check if a ref code is already taken (used before persisting). */
    boolean existsByRef(String ref);
    
    /** Total bulk orders count */
    @Query("SELECT COUNT(bo) FROM BulkOrder bo")
    long countTotalBulkOrders();
    
    /** Total bulk revenue (sum of grand totals) */
    @Query("SELECT COALESCE(SUM(bo.grandTotal), 0) FROM BulkOrder bo")
    java.math.BigDecimal sumTotalBulkRevenue();
    
    /** Total bulk discount applied */
    @Query("SELECT COALESCE(SUM(bo.discountAmount), 0) FROM BulkOrder bo")
    java.math.BigDecimal sumTotalBulkDiscount();
    
    /** Count bulk orders by status */
    @Query("SELECT bo.status, COUNT(bo) FROM BulkOrder bo GROUP BY bo.status")
    List<Object[]> countBulkOrdersByStatus();
}
