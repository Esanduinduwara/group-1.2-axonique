package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.request.CreateRetailerRequest;
import com.axonique_backend.axonique_backend.dto.request.CreateStaffRequest;
import com.axonique_backend.axonique_backend.dto.response.DashboardMetricsResponse;
import com.axonique_backend.axonique_backend.dto.response.DashboardMetricsResponse.MonthlyRevenue;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.UserSummaryResponse;
import com.axonique_backend.axonique_backend.exception.ResourceNotFoundException;
import com.axonique_backend.axonique_backend.mapper.ProductMapper;
import com.axonique_backend.axonique_backend.model.Product;
import com.axonique_backend.axonique_backend.model.Role;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.repository.BulkOrderRepository;
import com.axonique_backend.axonique_backend.repository.OrderRepository;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import com.axonique_backend.axonique_backend.service.interfaces.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Locale;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl implements AdminService {
    private static final String PRIMARY_ADMIN_EMAIL = "admin_now@axonique.com";
    private static final String LEGACY_ADMIN_EMAIL = "admin@axonique.com";
    private static final Set<String> STAFF_LOCKED_EMAILS = new HashSet<>(
            Arrays.asList("staff1@axonique.com", "staff_user@axonique.com"));

    private final OrderRepository orderRepository;
    private final BulkOrderRepository bulkOrderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ProductMapper productMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public DashboardMetricsResponse getDashboardMetrics() {
        // Regular Orders Metrics
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

        // Bulk Orders Metrics
        long totalBulkOrders = bulkOrderRepository.countTotalBulkOrders();
        BigDecimal totalBulkRevenue = bulkOrderRepository.sumTotalBulkRevenue();
        BigDecimal totalBulkDiscount = bulkOrderRepository.sumTotalBulkDiscount();
        
        // Bulk orders by status
        List<Object[]> bulkStatusRaw = bulkOrderRepository.countBulkOrdersByStatus();
        Map<String, Long> bulkOrdersByStatus = new HashMap<>();
        for (Object[] row : bulkStatusRaw) {
            bulkOrdersByStatus.put(row[0].toString(), (Long) row[1]);
        }

        return DashboardMetricsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalUsers(totalUsers)
                .revenueByMonth(revenueByMonth)
                .ordersByStatus(ordersByStatus)
                .estimatedCost(estimatedCost)
                .estimatedProfit(estimatedProfit)
                .totalBulkOrders(totalBulkOrders)
                .totalBulkRevenue(totalBulkRevenue)
                .bulkOrdersByStatus(bulkOrdersByStatus)
                .totalBulkDiscount(totalBulkDiscount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSummaryResponse> getAllUsers() {
        List<User> users = userRepository.findAllOrderByIdDesc();
        users.forEach(this::enforceRolePolicyIfNeeded);
        return users.stream()
                .filter(u -> u.getRole() != Role.ADMIN)
                .filter(u -> !LEGACY_ADMIN_EMAIL.equalsIgnoreCase(normalizeEmail(u.getEmail())))
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
    public UserSummaryResponse createRetailer(CreateRetailerRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Validate username not already taken
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken");
        }

        // Validate email not already registered
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email '" + normalizedEmail + "' is already registered");
        }

        // Create new retailer user
        User retailer = User.builder()
                .username(request.getUsername())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(resolveRoleForEmail(normalizedEmail, Role.RETAILER))
                .enabled(true)
                .build();

        User saved = userRepository.save(retailer);
        return UserSummaryResponse.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .role(saved.getRole().name())
                .enabled(saved.isEnabled())
                .build();
    }

    @Override
    public UserSummaryResponse createStaff(CreateStaffRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        // Validate username not already taken
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username '" + request.getUsername() + "' is already taken");
        }

        // Validate email not already registered
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException("Email '" + normalizedEmail + "' is already registered");
        }

        // Create new staff user
        User staff = User.builder()
                .username(request.getUsername())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(resolveRoleForEmail(normalizedEmail, Role.STAFF))
                .enabled(true)
                .build();

        User saved = userRepository.save(staff);
        return UserSummaryResponse.builder()
                .id(saved.getId())
                .username(saved.getUsername())
                .email(saved.getEmail())
                .role(saved.getRole().name())
                .enabled(saved.isEnabled())
                .build();
    }

    @Override
    public UserSummaryResponse updateUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        Role requestedRole;
        try {
            requestedRole = Role.valueOf(role.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid role: " + role + ". Must be CUSTOMER, STAFF, ADMIN, or RETAILER");
        }

        if (requestedRole == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Promoting users to ADMIN is not allowed.");
        }

        protectAdminSelfDemotion(user, requestedRole);
        user.setRole(resolveRoleForEmail(normalizeEmail(user.getEmail()), requestedRole));
        userRepository.save(user);
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .enabled(user.isEnabled())
                .build();
    }

    private void protectAdminSelfDemotion(User targetUser, Role requestedRole) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return;
        }

        String actorUsername = authentication.getName();
        if (!actorUsername.equalsIgnoreCase(targetUser.getUsername())) {
            return;
        }

        if (targetUser.getRole() == Role.ADMIN && requestedRole != Role.ADMIN) {
            throw new IllegalArgumentException("Admin users cannot change their own role.");
        }
    }

    private void enforceRolePolicyIfNeeded(User user) {
        String normalizedEmail = normalizeEmail(user.getEmail());
        Role enforcedRole = resolveRoleForEmail(normalizedEmail, user.getRole());
        if (user.getRole() != enforcedRole) {
            user.setRole(enforcedRole);
            userRepository.save(user);
        }
    }

    private Role resolveRoleForEmail(String email, Role requestedRole) {
        Role safeRequestedRole = requestedRole == null ? Role.CUSTOMER : requestedRole;

        if (PRIMARY_ADMIN_EMAIL.equals(email)) {
            return Role.ADMIN;
        }

        if (safeRequestedRole == Role.ADMIN) {
            return STAFF_LOCKED_EMAILS.contains(email) ? Role.STAFF : Role.CUSTOMER;
        }

        if (safeRequestedRole == Role.STAFF) {
            return STAFF_LOCKED_EMAILS.contains(email) ? Role.STAFF : Role.CUSTOMER;
        }

        return safeRequestedRole;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
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
        product.setInStock(quantity > 0);
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
