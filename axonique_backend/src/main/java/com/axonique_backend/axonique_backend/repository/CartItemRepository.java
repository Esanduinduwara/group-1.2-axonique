package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.CartItem;
import com.axonique_backend.axonique_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    // Get all cart items for a user
    List<CartItem> findByUser(User user);

    // Find specific item (same product + size)
    Optional<CartItem> findByUserAndProductIdAndSize(User user, Long productId, String size);

    // Delete all cart items of a user
    void deleteByUser(User user);
}