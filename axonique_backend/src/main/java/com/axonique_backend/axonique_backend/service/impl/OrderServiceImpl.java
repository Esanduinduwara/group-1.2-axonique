package com.axonique_backend.axonique_backend.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.stereotype.Service;
import com.axonique_backend.axonique_backend.dto.request.CartItemRequest;
import com.axonique_backend.axonique_backend.dto.request.PlaceOrderRequest;
import com.axonique_backend.axonique_backend.dto.request.ResendOrderVerificationRequest;
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
import com.axonique_backend.axonique_backend.service.OrderVerificationEmailService;
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
    private final OrderVerificationEmailService orderVerificationEmailService;

    @Override
    public OrderResponse placeOrder(PlaceOrderRequest request) {
        Order order = buildOrder(request);
        Order saved = orderRepository.save(order);
        orderVerificationEmailService.sendVerificationEmail(saved, saved.getVerificationToken());
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
        return orderRepository.findAllByOrderByIdDesc().stream().map(orderMapper::toResponse).toList();
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
        OrderStatus currentStatus = order.getStatus();
        validateStatusTransition(order.getStatus(), newStatus);
        if (newStatus == OrderStatus.CONFIRMED && currentStatus != OrderStatus.CONFIRMED) {
            deductInventoryForOrder(order);
        }
        order.setStatus(newStatus);

        // Save and flush updates the database immediately
        orderRepository.saveAndFlush(order);
    }

    @Override
    public OrderResponse verifyOrderByToken(String token) {
        String normalizedToken = token == null ? "" : token.trim();
        if (normalizedToken.isBlank()) {
            throw new BusinessException("Verification token is required.");
        }

        Order order = orderRepository.findByVerificationToken(normalizedToken)
                .orElseThrow(() -> new BusinessException("Verification link is invalid or has expired."));

        if (order.isVerificationTokenUsed() || order.getStatus() == OrderStatus.CONFIRMED) {
            return orderMapper.toResponse(order);
        }

        if (order.getVerificationTokenExpiresAt() == null
                || order.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("Verification link is invalid or has expired.");
        }

        deductInventoryForOrder(order);
        order.setStatus(OrderStatus.CONFIRMED);
        order.setVerificationTokenUsed(true);
        order.setVerificationCompletedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);
        orderVerificationEmailService.sendInvoiceEmail(saved);
        return orderMapper.toResponse(saved);
    }

    @Override
    public void resendVerificationEmail(ResendOrderVerificationRequest request) {
        String normalizedEmail = request.getCustomerEmail() == null
                ? ""
                : request.getCustomerEmail().trim().toLowerCase(Locale.ROOT);

        Order order = orderRepository.findByIdAndCustomerEmail(request.getOrderId(), normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Order", request.getOrderId()));

        if (order.getStatus() == OrderStatus.CONFIRMED) {
            throw new BusinessException("Order is already verified.");
        }

        if (order.getStatus() != OrderStatus.PENDING_VERIFICATION) {
            throw new BusinessException("Only unverified orders can request a new verification link.");
        }

        order.setVerificationToken(generateVerificationToken());
        order.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
        order.setVerificationTokenUsed(false);
        order.setVerificationCompletedAt(null);

        Order saved = orderRepository.save(order);
        orderVerificationEmailService.sendVerificationEmail(saved, saved.getVerificationToken());
    }

    private Order buildOrder(PlaceOrderRequest request) {
        BigDecimal subtotal = BigDecimal.ZERO;
        Order order = Order.builder()
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail().trim().toLowerCase(Locale.ROOT))
                .deliveryAddress(request.getDeliveryAddress())
                .status(OrderStatus.PENDING_VERIFICATION)
                .verificationToken(generateVerificationToken())
                .verificationTokenExpiresAt(LocalDateTime.now().plusHours(24))
                .verificationTokenUsed(false)
                .build();

        for (CartItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            if (!product.isInStock())
                throw new BusinessException("Product out of stock");
            if (itemReq.getQuantity() <= 0) {
                throw new BusinessException("Quantity must be greater than zero.");
            }
            if (product.getStockQuantity() < itemReq.getQuantity()) {
                throw new BusinessException("Insufficient stock for product: " + product.getName());
            }

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
        if (next == OrderStatus.PENDING_VERIFICATION) {
            throw new BusinessException("Cannot set order back to PENDING_VERIFICATION");
        }
        if (current == OrderStatus.PENDING_VERIFICATION && next == OrderStatus.PENDING) {
            throw new BusinessException("PENDING_VERIFICATION orders must be verified first.");
        }
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

    private String generateVerificationToken() {
        return UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
    }

    private void deductInventoryForOrder(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            if (product == null) {
                continue;
            }
            Product managedProduct = productRepository.findById(product.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", product.getId()));
            int newQty = managedProduct.getStockQuantity() - item.getQuantity();
            if (newQty < 0) {
                throw new BusinessException("Insufficient stock to confirm order for: " + managedProduct.getName());
            }
            managedProduct.setStockQuantity(newQty);
            managedProduct.setInStock(newQty > 0);
            productRepository.save(managedProduct);
        }
    }
}