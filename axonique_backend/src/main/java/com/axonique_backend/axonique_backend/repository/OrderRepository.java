package com.axonique_backend.axonique_backend.repository;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.axonique_backend.axonique_backend.model.Order;
import com.axonique_backend.axonique_backend.model.OrderStatus;

/**
 * data access layer for Orders.
 *
 * SOLID D: services depend on this abstraction, not a concrete DAO.
 * SOLID S: only handles order persistence queries.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByCustomerEmail(String email);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByCustomerEmailOrderByCreatedAtDesc(String email);

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findAllOrderByCreatedAtDesc();

    @Query("SELECT COALESCE(SUM(o.total), 0) FROM Order o")
    BigDecimal sumTotalRevenue();

    @Query("SELECT YEAR(o.createdAt), MONTH(o.createdAt), SUM(o.total) FROM Order o GROUP BY YEAR(o.createdAt), MONTH(o.createdAt) ORDER BY YEAR(o.createdAt) DESC, MONTH(o.createdAt) DESC")
    List<Object[]> findMonthlyRevenue();

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countOrdersByStatus();

    @Query("SELECT o FROM Order o WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(o.customerName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.customerEmail) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY o.createdAt DESC")
    List<Order> searchOrders(@Param("search") String search);
}
