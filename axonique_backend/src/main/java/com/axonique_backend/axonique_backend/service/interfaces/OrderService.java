package com.axonique_backend.axonique_backend.service.interfaces;

import java.util.List;
import com.axonique_backend.axonique_backend.dto.request.PlaceOrderRequest;
import com.axonique_backend.axonique_backend.model.OrderStatus;
import com.axonique_backend.axonique_backend.dto.response.OrderResponse;

public interface OrderService {

    OrderResponse placeOrder(PlaceOrderRequest request);

    OrderResponse getOrderById(Long id);

    List<OrderResponse> getOrdersByEmail(String email);

    List<OrderResponse> getAllOrders();

    List<OrderResponse> searchOrders(String searchTerm);

    // CHANGE THIS LINE: Set return type to void
    void updateOrderStatus(Long id, OrderStatus newStatus);
}