package com.axonique_backend.axonique_backend.controller;

import com.axonique_backend.axonique_backend.dto.request.ClientProductSyncRequest;
import com.axonique_backend.axonique_backend.dto.request.CreateRetailerRequest;
import com.axonique_backend.axonique_backend.dto.request.CreateStaffRequest;
import com.axonique_backend.axonique_backend.dto.response.ApiResponse;
import com.axonique_backend.axonique_backend.dto.response.ClientProductSyncResponse;
import com.axonique_backend.axonique_backend.dto.response.DashboardMetricsResponse;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.UserSummaryResponse;
import com.axonique_backend.axonique_backend.service.interfaces.AdminService;
import com.axonique_backend.axonique_backend.service.interfaces.ClientProductSyncService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AdminController — secured endpoints for admin users only.
 * Role enforcement: @PreAuthorize("hasRole('ADMIN')") on all methods.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
public class AdminController {

    private final AdminService adminService;
    private final ClientProductSyncService clientProductSyncService;

    /**
     * GET /api/admin/dashboard/metrics
     * Returns KPI metrics for the admin dashboard.
     */
    @GetMapping("/dashboard/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getDashboardMetrics() {
        return ResponseEntity.ok(ApiResponse.ok("Dashboard metrics retrieved", adminService.getDashboardMetrics()));
    }

    /**
     * GET /api/admin/users
     * Returns all users (no passwords exposed).
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.ok("Users retrieved", adminService.getAllUsers()));
    }

    /**
     * POST /api/admin/retailers
     * Create a new retailer account.
     * ADMIN only.
     */
    @PostMapping("/retailers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> createRetailer(
            @Valid @RequestBody CreateRetailerRequest request) {
        UserSummaryResponse created = adminService.createRetailer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(created));
    }

    /**
     * POST /api/admin/staff
     * Create a new staff account.
     * ADMIN only.
     */
    @PostMapping("/staff")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        UserSummaryResponse created = adminService.createStaff(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(created));
    }

    /**
     * PUT /api/admin/users/{id}/role
     * Update a user's role.
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateUserRole(
            @PathVariable Long id,
            @RequestParam String role) {
        return ResponseEntity.ok(ApiResponse.ok("User role updated", adminService.updateUserRole(id, role)));
    }

    /**
     * GET /api/admin/inventory
     * Returns all products sorted by stockQuantity ascending.
     * Accessible to ADMIN or STAFF.
     */
    @GetMapping("/inventory")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getInventory() {
        return ResponseEntity.ok(ApiResponse.ok("Inventory retrieved", adminService.getInventory()));
    }

    /**
     * PATCH /api/admin/inventory/{id}/stock
     * Updates only the stockQuantity for a product.
     * Accessible to ADMIN or STAFF.
     */
    @PatchMapping("/inventory/{id}/stock")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateStock(
            @PathVariable Long id,
            @RequestParam int quantity) {
        return ResponseEntity.ok(ApiResponse.ok("Stock updated", adminService.updateStock(id, quantity)));
    }

    /**
     * GET /api/admin/inventory/low-stock
     * Returns products where stockQuantity <= lowStockThreshold.
     * Accessible to ADMIN or STAFF.
     */
    @GetMapping("/inventory/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        return ResponseEntity.ok(ApiResponse.ok("Low stock products retrieved", adminService.getLowStockProducts()));
    }

    /**
     * POST /api/admin/sync/client-products
     * Synchronizes client product data into the system.
     * Accessible to ADMIN or STAFF.
     */
    @PostMapping("/sync/client-products")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<ApiResponse<ClientProductSyncResponse>> syncClientProducts(
            @RequestBody ClientProductSyncRequest request) {
        ClientProductSyncResponse response = clientProductSyncService.synchronize(request);
        return ResponseEntity.ok(ApiResponse.ok("Client product synchronization completed", response));
    }

    /**
     * DELETE /api/admin/users/{id}
     * Permanently removes a user account.
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted", null));
    }
}