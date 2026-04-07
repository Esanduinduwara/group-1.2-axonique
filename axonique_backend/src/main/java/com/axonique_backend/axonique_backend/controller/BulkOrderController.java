package com.axonique_backend.axonique_backend.controller;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.axonique_backend.axonique_backend.dto.response.ApiResponse;
import com.axonique_backend.axonique_backend.dto.response.BulkOrderResponse;
import com.axonique_backend.axonique_backend.model.BulkOrderStatus;
import com.axonique_backend.axonique_backend.service.interfaces.BulkOrderService;


/**
 * BulkOrderController — REST endpoints for retailer bulk order management.
 *
 * Base URL : /api/bulk-orders
 *
 * Endpoints:
 *   POST   /api/bulk-orders          — create a new bulk order
 *   GET    /api/bulk-orders/my       — list the caller's own bulk orders
 *   GET    /api/bulk-orders/{id}     — retrieve one bulk order by ID
 *   PATCH  /api/bulk-orders/{id}/status — update order status (admin/staff)
 *
 * Authentication is enforced in SecurityConfig; this controller only
 * extracts the principal name from the injected Authentication object.
 *
 * SOLID S : HTTP concerns only — no business logic, no DB calls.
 * SOLID D : depends on BulkOrderService interface, not the impl.
 */
@RestController
@RequestMapping("/api/bulk-orders")
@RequiredArgsConstructor
public class BulkOrderController {

    private final BulkOrderService bulkOrderService;

    // ── Endpoints ────────────────────────────────────────────────────────────

    /**
     * POST /api/bulk-orders
     *
     * Create a new bulk order for the authenticated retailer.
     * The service resolves the discount tier server-side from the total unit
     * count, so the client-supplied unitPrice values are ignored for discount
     * calculation (prices are always taken from the Product record).
     *
     * Returns 201 CREATED with the persisted order DTO.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BulkOrderResponse>> createBulkOrder(
            @Valid @RequestBody BulkOrderRequest request,
            Authentication authentication) {

        String username = resolveUsername(authentication);
        BulkOrderResponse response = bulkOrderService.createBulkOrder(request, username);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }

    /**
     * GET /api/bulk-orders/my
     *
     * Return all bulk orders placed by the authenticated retailer, sorted
     * by creation date descending (newest first).
     *
     * Returns 200 OK with a (possibly empty) list.
     */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BulkOrderResponse>>> getMyBulkOrders(
            Authentication authentication) {

        String username = resolveUsername(authentication);
        List<BulkOrderResponse> orders = bulkOrderService.getMyBulkOrders(username);
        return ResponseEntity.ok(ApiResponse.ok("Bulk orders retrieved", orders));
    }

    /**
     * GET /api/bulk-orders/all
     *
     * Return all bulk orders from all retailers (admin/staff only).
     * Sorted by creation date descending (newest first).
     *
     * Returns 200 OK with a (possibly empty) list.
     */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<BulkOrderResponse>>> getAllBulkOrders() {
        List<BulkOrderResponse> orders = bulkOrderService.getAllBulkOrders();
        return ResponseEntity.ok(ApiResponse.ok("All bulk orders retrieved", orders));
    }

    /**
     * GET /api/bulk-orders/{id}
     *
     * Retrieve a specific bulk order by its database ID.
     * Returns 404 if the order does not exist (thrown by the service layer
     * and handled by GlobalExceptionHandler).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BulkOrderResponse>> getBulkOrder(
            @PathVariable Long id,
            Authentication authentication) {

        BulkOrderResponse response = bulkOrderService.getBulkOrderById(id);
        return ResponseEntity.ok(ApiResponse.ok("Bulk order retrieved", response));
    }

    /**
     * PATCH /api/bulk-orders/{id}/status
     *
     * Update the lifecycle status of a bulk order.
     * Intended for admin / staff use; access is controlled in SecurityConfig.
     *
     * Returns 200 OK on success, 400 if the status value is invalid,
     * 422 if the transition violates business rules (BusinessException →
     * GlobalExceptionHandler).
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {

        BulkOrderStatus bulkOrderStatus;
        try {
            bulkOrderStatus = BulkOrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.error("Invalid status value: '" + status
                            + "'. Valid values: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED"));
        }

        bulkOrderService.updateBulkOrderStatus(id, bulkOrderStatus);
        return ResponseEntity.ok(ApiResponse.noContent("Bulk order status updated to " + bulkOrderStatus));
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    /**
     * Extract the username from the Spring Security Authentication principal.
     * Throws 401-equivalent AccessDeniedException if no principal is present
     * (should be caught by the security filter before reaching here, but
     * guarded defensively).
     */
    private String resolveUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new AccessDeniedException("Authentication required");
        }
        return authentication.getName();
    }

    // ── Inner DTOs ───────────────────────────────────────────────────────────

    /**
     * Inbound DTO for creating a bulk order.
     *
     * Bean Validation annotations enforce field presence before the request
     * reaches the service layer, consistent with the pattern used in
     * PlaceOrderRequest and ProductRequest.
     */
    public static class BulkOrderRequest {

        @NotBlank(message = "Company name is required")
        public String companyName;

        @NotBlank(message = "Contact person is required")
        public String contactPerson;

        @NotBlank(message = "Contact email is required")
        public String contactEmail;

        @NotBlank(message = "Delivery address is required")
        public String deliveryAddress;

        public String notes;

        @NotEmpty(message = "At least one item is required")
        public List<BulkOrderItemRequest> items;

        // Getters
        public String getCompanyName()              { return companyName; }
        public String getContactPerson()            { return contactPerson; }
        public String getContactEmail()             { return contactEmail; }
        public String getDeliveryAddress()          { return deliveryAddress; }
        public String getNotes()                    { return notes; }
        public List<BulkOrderItemRequest> getItems(){ return items; }

        // Setters
        public void setCompanyName(String v)              { this.companyName = v; }
        public void setContactPerson(String v)            { this.contactPerson = v; }
        public void setContactEmail(String v)             { this.contactEmail = v; }
        public void setDeliveryAddress(String v)          { this.deliveryAddress = v; }
        public void setNotes(String v)                    { this.notes = v; }
        public void setItems(List<BulkOrderItemRequest> v){ this.items = v; }
    }

    /**
     * Inbound DTO for a single line item inside a BulkOrderRequest.
     *
     * Note: unitPrice is accepted from the client for display / audit purposes
     * only. The service always re-reads the price from the Product entity to
     * prevent client-side price manipulation.
     */
    public static class BulkOrderItemRequest {

        @NotNull(message = "Product ID is required")
        public Long productId;

        public String size;

        @Min(value = 1, message = "Quantity must be at least 1")
        public int quantity;

        /** Client-supplied unit price — informational only; not used for totals. */
        public BigDecimal unitPrice;

        // Getters
        public Long       getProductId() { return productId; }
        public String     getSize()      { return size; }
        public int        getQuantity()  { return quantity; }
        public BigDecimal getUnitPrice() { return unitPrice; }

        // Setters
        public void setProductId(Long v)       { this.productId = v; }
        public void setSize(String v)          { this.size = v; }
        public void setQuantity(int v)         { this.quantity = v; }
        public void setUnitPrice(BigDecimal v) { this.unitPrice = v; }
    }
}