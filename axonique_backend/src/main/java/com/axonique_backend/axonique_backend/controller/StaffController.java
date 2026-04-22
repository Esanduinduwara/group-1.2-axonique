package com.axonique_backend.axonique_backend.controller;

import com.axonique_backend.axonique_backend.dto.response.ApiResponse;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.StaffActivityResponse;
import com.axonique_backend.axonique_backend.service.interfaces.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * StaffController — endpoints accessible to ADMIN or STAFF roles.
 */
@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','STAFF')")
public class StaffController {

    private final StaffService staffService;

    /**
     * GET /api/staff/activity
     * Returns recent orders and recent registrations.
     */
    @GetMapping("/activity")
    public ResponseEntity<ApiResponse<StaffActivityResponse>> getActivity() {
        return ResponseEntity.ok(ApiResponse.ok("Staff activity retrieved", staffService.getActivity()));
    }

    /**
     * GET /api/staff/low-stock
     * Returns products below stock threshold.
     */
    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStock() {
        return ResponseEntity.ok(ApiResponse.ok("Low stock products retrieved", staffService.getLowStockProducts()));
    }
}
