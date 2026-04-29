package com.axonique_backend.axonique_backend.service;

import com.axonique_backend.axonique_backend.model.CartItem;
import com.axonique_backend.axonique_backend.model.Product;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.repository.CartItemRepository;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public List<CartItem> getCartItems(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return cartItemRepository.findByUser(user);
    }

    public void addToCart(Long userId, Long productId, String size, int qty) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        CartItem existingItem = cartItemRepository
                .findByUserAndProductIdAndSize(user, productId, size)
                .orElse(null);

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + qty);
            cartItemRepository.save(existingItem);
        } else {
            CartItem item = CartItem.builder()
                    .user(user)
                    .product(product)
                    .size(size)
                    .quantity(qty)
                    .build();
            cartItemRepository.save(item);
        }
    }

    public void removeFromCart(Long userId, Long productId, String size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CartItem existingItem = cartItemRepository
                .findByUserAndProductIdAndSize(user, productId, size)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        cartItemRepository.delete(existingItem);
    }

    public void updateQuantity(Long userId, Long productId, String size, int qty) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CartItem existingItem = cartItemRepository
                .findByUserAndProductIdAndSize(user, productId, size)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        if (qty <= 0) {
            cartItemRepository.delete(existingItem);
        } else {
            existingItem.setQuantity(qty);
            cartItemRepository.save(existingItem);
        }
    }

    public void clearCart(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        cartItemRepository.deleteByUser(user);
    }
}