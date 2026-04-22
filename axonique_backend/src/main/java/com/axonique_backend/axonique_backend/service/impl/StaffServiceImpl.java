package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.StaffActivityResponse;
import com.axonique_backend.axonique_backend.mapper.ProductMapper;
import com.axonique_backend.axonique_backend.model.Order;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.repository.OrderRepository;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import com.axonique_backend.axonique_backend.service.interfaces.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StaffServiceImpl implements StaffService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    public StaffActivityResponse getActivity() {
        List<Order> recentOrders = orderRepository.findAllOrderByCreatedAtDesc()
                .stream().limit(10).toList();

        List<User> recentUsers = userRepository.findRecentRegistrations(PageRequest.of(0, 10));

        List<StaffActivityResponse.RecentOrder> orderList = recentOrders.stream()
                .map(o -> StaffActivityResponse.RecentOrder.builder()
                        .id(o.getId())
                        .customerName(o.getCustomerName())
                        .total(o.getTotal())
                        .status(o.getStatus().name())
                        .createdAt(o.getCreatedAt())
                        .build())
                .toList();

        List<StaffActivityResponse.RecentRegistration> regList = recentUsers.stream()
                .map(u -> StaffActivityResponse.RecentRegistration.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .email(u.getEmail())
                        .build())
                .toList();

        return StaffActivityResponse.builder()
                .recentOrders(orderList)
                .recentRegistrations(regList)
                .build();
    }

    @Override
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }
}
