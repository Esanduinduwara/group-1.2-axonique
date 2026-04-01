package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.response.DashboardMetricsResponse;
import com.axonique_backend.axonique_backend.dto.response.DashboardMetricsResponse.MonthlyRevenue;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.UserSummaryResponse;
import com.axonique_backend.axonique_backend.exception.ResourceNotFoundException;
import com.axonique_backend.axonique_backend.mapper.ProductMapper;
import com.axonique_backend.axonique_backend.model.Product;
import com.axonique_backend.axonique_backend.model.Role;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.repository.OrderRepository;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import com.axonique_backend.axonique_backend.service.interfaces.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl implements AdminService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public DashboardMetricsResponse getDashboardMetrics() {
        BigDecimal totalRevenue = orderRepository.sumTotalRevenue();
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();

        // Monthly revenue - last 12 months
        List<Object[]> monthlyRaw = orderRepository.findMonthlyRevenue();
        List<MonthlyRevenue> revenueByMonth = new ArrayList<>();
        int limit = Math.min(monthlyRaw.size(), 12);
        for (int i = 0; i < limit; i++) {
            Object[] row = monthlyRaw.get(i);
            // Defensive casting for different JDBC drivers
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            BigDecimal amount = (BigDecimal) row[2];
            
            String dateLabel = String.format("%d-%02d", year, month);
            revenueByMonth.add(MonthlyRevenue.builder()
                    .month(dateLabel)
                    .revenue(amount)
                    .build());
        }

        // Orders by status
        List<Object[]> statusRaw = orderRepository.countOrdersByStatus();
        Map<String, Long> ordersByStatus = new HashMap<>();
        for (Object[] row : statusRaw) {
            ordersByStatus.put(row[0].toString(), (Long) row[1]);
        }

        BigDecimal estimatedCost = totalRevenue.multiply(BigDecimal.valueOf(0.60)).setScale(2, RoundingMode.HALF_UP);
        BigDecimal estimatedProfit = totalRevenue.subtract(estimatedCost).setScale(2, RoundingMode.HALF_UP);

        return DashboardMetricsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalUsers(totalUsers)
                .revenueByMonth(revenueByMonth)
                .ordersByStatus(ordersByStatus)
                .estimatedCost(estimatedCost)
                .estimatedProfit(estimatedProfit)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAllUsers() {
        return userRepository.findAllOrderByIdDesc().stream()
                .map(u -> UserSummaryResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .role(u.getRole() != null ? u.getRole().name() : "CUSTOMER")
                        .enabled(u.isEnabled())
                        .build())
                .toList();
    }

    @Override
    public UserSummaryResponse updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        try {
            user.setRole(Role.valueOf(role.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role + ". Must be CUSTOMER, STAFF, or ADMIN");
        }
        userRepository.save(user);
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getInventory() {
        return productRepository.findAllOrderByStockQuantityAsc()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    public ProductResponse updateStock(Long productId, int quantity) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId));
        product.setStockQuantity(quantity);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        userRepository.delete(user);
    }
}
