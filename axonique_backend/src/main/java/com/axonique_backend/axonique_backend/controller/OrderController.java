package com.axonique_backend.axonique_backend.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.axonique_backend.axonique_backend.dto.request.PlaceOrderRequest;
import com.axonique_backend.axonique_backend.dto.response.ApiResponse;
import com.axonique_backend.axonique_backend.dto.response.OrderResponse;
import com.axonique_backend.axonique_backend.model.OrderStatus;
import com.axonique_backend.axonique_backend.service.interfaces.OrderService;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(
            @Valid @RequestBody PlaceOrderRequest request) {
        OrderResponse order = orderService.placeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrder(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.ok("Order retrieved", order));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrders(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String search) {
        List<OrderResponse> orders;
        if (email != null && !email.isBlank()) {
            orders = orderService.getOrdersByEmail(email);
        } else if (search != null && !search.isBlank()) {
            orders = orderService.searchOrders(search);
        } else {
            orders = orderService.getAllOrders();
        }
        return ResponseEntity.ok(ApiResponse.ok("Orders retrieved", orders));
    }

    /**
     * FIXED: Changed return type to ApiResponse<Void> to resolve compilation type mismatch
     * with the void return type of orderService.updateOrderStatus.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            OrderStatus orderStatus = OrderStatus.valueOf(status.toUpperCase());
            
            // Calling the service which returns void
            orderService.updateOrderStatus(id, orderStatus);
            
            // Returning a success response without an order object
            return ResponseEntity.ok(ApiResponse.noContent("Order status updated successfully"));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid status value: " + status));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}