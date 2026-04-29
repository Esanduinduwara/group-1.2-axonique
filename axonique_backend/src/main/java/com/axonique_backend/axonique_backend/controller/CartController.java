package com.axonique_backend.axonique_backend.controller;

import com.axonique_backend.axonique_backend.model.CartItem;
import com.axonique_backend.axonique_backend.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
})
public class CartController {

    private final CartService cartService;

    @GetMapping("/{userId}")
    public List<CartItem> getCart(@PathVariable Long userId) {
        return cartService.getCartItems(userId);
    }

    @PostMapping("/add")
    public String addToCart(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        Long productId = Long.valueOf(body.get("productId").toString());
        String size = body.get("size").toString();
        int qty = Integer.parseInt(body.get("qty").toString());

        cartService.addToCart(userId, productId, size, qty);
        return "Item added to cart";
    }

    @PutMapping("/update")
    public String updateQuantity(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        Long productId = Long.valueOf(body.get("productId").toString());
        String size = body.get("size").toString();
        int qty = Integer.parseInt(body.get("qty").toString());

        cartService.updateQuantity(userId, productId, size, qty);
        return "Cart updated";
    }

    @DeleteMapping("/remove")
    public String removeFromCart(@RequestBody Map<String, Object> body) {
        Long userId = Long.valueOf(body.get("userId").toString());
        Long productId = Long.valueOf(body.get("productId").toString());
        String size = body.get("size").toString();

        cartService.removeFromCart(userId, productId, size);
        return "Item removed from cart";
    }

    @DeleteMapping("/clear/{userId}")
    public String clearCart(@PathVariable Long userId) {
        cartService.clearCart(userId);
        return "Cart cleared";
    }
}