package com.axonique_backend.axonique_backend.service.impl;

import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Service;
import com.axonique_backend.axonique_backend.dto.request.CartItemRequest;
import com.axonique_backend.axonique_backend.dto.request.PlaceOrderRequest;
import com.axonique_backend.axonique_backend.dto.response.OrderResponse;
import com.axonique_backend.axonique_backend.exception.BusinessException;
import com.axonique_backend.axonique_backend.exception.ResourceNotFoundException;
import com.axonique_backend.axonique_backend.mapper.OrderMapper;
import com.axonique_backend.axonique_backend.model.Order;
import com.axonique_backend.axonique_backend.model.OrderItem;
import com.axonique_backend.axonique_backend.model.OrderStatus;
import com.axonique_backend.axonique_backend.model.Product;
import com.axonique_backend.axonique_backend.repository.OrderRepository;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.service.interfaces.OrderService;
import com.axonique_backend.axonique_backend.service.interfaces.ShippingCalculator;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ShippingCalculator shippingCalculator;
    private final OrderMapper orderMapper;

    @Override
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        Order order = buildOrder(request);
        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        return orderMapper.toResponse(findOrderOrThrow(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByEmail(String email) {
        return orderRepository.findByCustomerEmailOrderByCreatedAtDesc(email)
                .stream().map(orderMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAll().stream().map(orderMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> searchOrders(String searchTerm) {
        return orderRepository.searchOrders(searchTerm).stream().map(orderMapper::toResponse).toList();
    }

    /**
     * FIXED: Changed return type to void to match OrderService interface.
     * Removed the return statement and the mapper call.
     */
    @Override
    @Transactional
    public void updateOrderStatus(Long id, OrderStatus newStatus) {
        Order order = findOrderOrThrow(id);
        validateStatusTransition(order.getStatus(), newStatus);
        order.setStatus(newStatus);

        // Save and flush updates the database immediately
        orderRepository.saveAndFlush(order);
    }

    private Order buildOrder(PlaceOrderRequest request) {
        BigDecimal subtotal = BigDecimal.ZERO;
        Order order = Order.builder()
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail())
                .deliveryAddress(request.getDeliveryAddress())
                .status(OrderStatus.PENDING)
                .build();

        for (CartItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            if (!product.isInStock())
                throw new BusinessException("Product out of stock");

            OrderItem item = OrderItem.from(product, itemReq.getSize(), itemReq.getQuantity());
            order.addItem(item);
            subtotal = subtotal.add(item.getLineTotal());
        }

        BigDecimal shippingFee = shippingCalculator.calculate(subtotal);
        order.setSubtotal(subtotal);
        order.setShippingFee(shippingFee);
        order.setTotal(subtotal.add(shippingFee));
        return order;
    }

    private void validateStatusTransition(OrderStatus current, OrderStatus next) {
        if (current == next)
            return;
        if (current == OrderStatus.DELIVERED || current == OrderStatus.CANCELLED) {
            throw new BusinessException("Cannot update a finalized order (" + current + ")");
        }
        if (next == OrderStatus.PENDING && current != OrderStatus.PENDING) {
            throw new BusinessException("Cannot revert to PENDING");
        }
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }
}