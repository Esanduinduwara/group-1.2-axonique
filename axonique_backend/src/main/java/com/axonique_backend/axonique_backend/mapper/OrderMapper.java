package com.axonique_backend.axonique_backend.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.axonique_backend.axonique_backend.dto.response.OrderItemResponse;
import com.axonique_backend.axonique_backend.dto.response.OrderResponse;
import com.axonique_backend.axonique_backend.model.Order;
import com.axonique_backend.axonique_backend.model.OrderItem;

/**
 * converts between Order domain models and response DTOs.
 *
 * SOLID S: mapping logic isolated from service and controller concerns.
 * Encapsulation: callers don't need to know the mapping details.
 */
@Component
public class OrderMapper {

    public OrderResponse toResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .deliveryAddress(order.getDeliveryAddress())
                .subTotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .total(order.getTotal())
                .status(order.getStatus().name())
                .items(mapItems(order.getItems()))
                .createdAt(order.getCreatedAt())
                .build();
    }

    private List<OrderItemResponse> mapItems(List<OrderItem> items) {
        return items.stream()
                .map(this::toItemResponse)
                .toList();
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .selectedSize(item.getSelectedSize())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
