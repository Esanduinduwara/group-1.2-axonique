package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductIdAndVariant(Long productId, String variant);
}