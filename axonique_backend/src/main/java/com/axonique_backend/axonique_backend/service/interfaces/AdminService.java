package com.axonique_backend.axonique_backend.service.interfaces;

import com.axonique_backend.axonique_backend.dto.response.DashboardMetricsResponse;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.UserSummaryResponse;

import java.util.List;

public interface AdminService {
    DashboardMetricsResponse getDashboardMetrics();

    List<UserSummaryResponse> getAllUsers();

    UserSummaryResponse updateUserRole(Long userId, String role);

    List<ProductResponse> getInventory();

    ProductResponse updateStock(Long productId, int quantity);

    List<ProductResponse> getLowStockProducts();

    void deleteUser(Long userId);
}
