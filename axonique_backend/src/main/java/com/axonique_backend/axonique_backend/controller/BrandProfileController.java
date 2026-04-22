package com.axonique_backend.axonique_backend.controller;

import com.axonique_backend.axonique_backend.dto.request.BrandProfileRequest;
import com.axonique_backend.axonique_backend.dto.response.ApiResponse;
import com.axonique_backend.axonique_backend.dto.response.BrandProfileResponse;
import com.axonique_backend.axonique_backend.service.interfaces.BrandProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * BrandProfileController
 * GET /api/brand — public
 * PUT /api/brand — ADMIN only
 */
@RestController
@RequestMapping("/api/brand")
@RequiredArgsConstructor
public class BrandProfileController {

    private final BrandProfileService brandProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<BrandProfileResponse>> getBrandProfile() {
        return ResponseEntity.ok(ApiResponse.ok("Brand profile retrieved", brandProfileService.getBrandProfile()));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<BrandProfileResponse>> updateBrandProfile(
            @RequestBody BrandProfileRequest request) {
        return ResponseEntity
                .ok(ApiResponse.ok("Brand profile updated", brandProfileService.updateBrandProfile(request)));
    }
}
