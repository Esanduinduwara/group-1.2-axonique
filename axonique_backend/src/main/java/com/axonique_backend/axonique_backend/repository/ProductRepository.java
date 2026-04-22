package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * data access layer for Products.
 *
 * SOLID D (Dependency Inversion): services depend on this interface,
 *   not on a concrete DAO class.
 * SOLID S (Single Responsibility): only data access — no business logic.
 */
@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByCategory(String category);

    List<Product> findByInStockTrue();

    List<Product> findByCategoryAndInStockTrue(String category);

    boolean existsByName(String name);

    @Query("SELECT DISTINCT p.category FROM Product p ORDER BY p.category")
    List<String> findDistinctCategories();

    @Query("SELECT p FROM Product p WHERE p.stockQuantity <= p.lowStockThreshold ORDER BY p.stockQuantity ASC")
    List<Product> findLowStockProducts();

    @Query("SELECT p FROM Product p ORDER BY p.stockQuantity ASC")
    List<Product> findAllOrderByStockQuantityAsc();
}
