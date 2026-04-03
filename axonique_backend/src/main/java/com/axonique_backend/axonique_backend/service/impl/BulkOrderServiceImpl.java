package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.controller.BulkOrderController.BulkOrderItemRequest;
import com.axonique_backend.axonique_backend.controller.BulkOrderController.BulkOrderRequest;
import com.axonique_backend.axonique_backend.dto.response.BulkOrderResponse;
import com.axonique_backend.axonique_backend.exception.BusinessException;
import com.axonique_backend.axonique_backend.exception.ResourceNotFoundException;
import com.axonique_backend.axonique_backend.mapper.BulkOrderMapper;
import com.axonique_backend.axonique_backend.model.*;
import com.axonique_backend.axonique_backend.repository.BulkOrderRepository;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import com.axonique_backend.axonique_backend.service.interfaces.BulkOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * BulkOrderServiceImpl — concrete implementation of BulkOrderService.
 *
 * Responsibilities:
 *   1. Resolve the authenticated retailer from the username.
 *   2. Look up products, validate stock, and build BulkOrderItem snapshots.
 *   3. Apply server-side discount tiers (prevents client-side manipulation).
 *   4. Persist and return mapped response DTOs.
 *   5. Guard status transitions against invalid moves.
 *
 * SOLID S : only bulk-order business logic — no HTTP, no mapping.
 * SOLID D : depends on repository / mapper abstractions, not concretions.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BulkOrderServiceImpl implements BulkOrderService {

    // ── Discount tier thresholds (mirrors discount_tiers table seed data) ────
    // Evaluated server-side so clients cannot manipulate the discount.
    private static final int    TIER_PLATINUM_MIN =  500;
    private static final double TIER_PLATINUM_PCT =   20.0;
    private static final int    TIER_GOLD_MIN     =  200;
    private static final double TIER_GOLD_PCT     =   15.0;
    private static final int    TIER_SILVER_MIN   =  100;
    private static final double TIER_SILVER_PCT   =   10.0;
    private static final int    TIER_BRONZE_MIN   =   50;
    private static final double TIER_BRONZE_PCT   =    5.0;

    private final BulkOrderRepository bulkOrderRepository;
    private final ProductRepository   productRepository;
    private final UserRepository      userRepository;
    private final BulkOrderMapper     bulkOrderMapper;

    // ── Public API ───────────────────────────────────────────────────────────

    @Override
    public BulkOrderResponse createBulkOrder(BulkOrderRequest request, String username) {
        User retailer = resolveRetailer(username);
        validateRequest(request);

        // 1. Calculate total quantity across all requested line items to
        //    determine the applicable discount tier (server-side authority).
        int totalQty = request.getItems().stream()
                .mapToInt(BulkOrderItemRequest::getQuantity)
                .sum();

        BigDecimal discountPct = resolveDiscountPct(totalQty);

        // 2. Build the order shell with a unique reference number.
        String ref = generateUniqueRef();
        BulkOrder order = BulkOrder.builder()
                .ref(ref)
                .retailer(retailer)
                .companyName(request.getCompanyName())
                .contactPerson(request.getContactPerson())
                .contactEmail(request.getContactEmail())
                .deliveryAddress(request.getDeliveryAddress())
                .notes(request.getNotes())
                .discountPct(discountPct)
                .totalQty(totalQty)
                .status(BulkOrderStatus.PENDING)
                .build();

        // 3. Resolve products, build item snapshots, accumulate subtotal.
        BigDecimal subtotal = BigDecimal.ZERO;
        for (BulkOrderItemRequest itemReq : request.getItems()) {
            if (itemReq.getQuantity() < 1) {
                throw new BusinessException("Each line item must have quantity ≥ 1");
            }

            Product product = productRepository.findById(itemReq.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product", itemReq.getProductId()));

            if (!product.isInStock()) {
                throw new BusinessException(
                        "Product \"" + product.getName() + "\" is currently out of stock");
            }

            // Use the authoritative DB price, ignoring whatever the client sent.
            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineSubtotal = unitPrice.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            BigDecimal discountFactor = BigDecimal.ONE
                    .subtract(discountPct.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP));
            BigDecimal lineTotal = lineSubtotal.multiply(discountFactor)
                    .setScale(2, RoundingMode.HALF_UP);

            BulkOrderItem item = BulkOrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .productCategory(product.getCategory())
                    .selectedSize(itemReq.getSize())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(unitPrice)
                    .discountPct(discountPct)
                    .lineTotal(lineTotal)
                    .build();

            order.addItem(item);
            subtotal = subtotal.add(lineSubtotal);
        }

        // 4. Compute order-level totals.
        BigDecimal discountAmount = subtotal
                .multiply(discountPct.divide(BigDecimal.valueOf(100), 10, RoundingMode.HALF_UP))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal grandTotal = subtotal.subtract(discountAmount).setScale(2, RoundingMode.HALF_UP);

        order.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        order.setDiscountAmount(discountAmount);
        order.setGrandTotal(grandTotal);

        BulkOrder saved = bulkOrderRepository.save(order);
        return bulkOrderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BulkOrderResponse> getMyBulkOrders(String username) {
        User retailer = resolveRetailer(username);
        return bulkOrderRepository.findByRetailerWithItems(retailer)
                .stream()
                .map(bulkOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<BulkOrderResponse> getAllBulkOrders() {
        return bulkOrderRepository.findAllWithItems()
                .stream()
                .map(bulkOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BulkOrderResponse getBulkOrderById(Long id) {
        BulkOrder order = bulkOrderRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("BulkOrder", id));
        return bulkOrderMapper.toResponse(order);
    }

    @Override
    public void updateBulkOrderStatus(Long id, BulkOrderStatus newStatus) {
        BulkOrder order = bulkOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BulkOrder", id));

        validateStatusTransition(order.getStatus(), newStatus);
        order.setStatus(newStatus);
        bulkOrderRepository.saveAndFlush(order);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Resolve the User entity for the given username.
     * Throws ResourceNotFoundException (→ 404) if the principal is unknown.
     */
    private User resolveRetailer(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User (retailer)", -1L));
    }

    /**
     * Determine the discount percentage that applies to a given total unit
     * count, using the same tier thresholds stored in discount_tiers.
     *
     * Server-side resolution ensures clients cannot manipulate discount values.
     */
    private BigDecimal resolveDiscountPct(int totalQty) {
        if (totalQty >= TIER_PLATINUM_MIN) return BigDecimal.valueOf(TIER_PLATINUM_PCT);
        if (totalQty >= TIER_GOLD_MIN)     return BigDecimal.valueOf(TIER_GOLD_PCT);
        if (totalQty >= TIER_SILVER_MIN)   return BigDecimal.valueOf(TIER_SILVER_PCT);
        if (totalQty >= TIER_BRONZE_MIN)   return BigDecimal.valueOf(TIER_BRONZE_PCT);
        return BigDecimal.ZERO;
    }

    /**
     * Validate a status transition using the same rules as OrderServiceImpl.
     * Finalized orders (DELIVERED / CANCELLED) cannot be moved further.
     * PENDING cannot be re-entered once left.
     */
    private void validateStatusTransition(BulkOrderStatus current, BulkOrderStatus next) {
        if (current == next) return;

        if (current == BulkOrderStatus.DELIVERED || current == BulkOrderStatus.CANCELLED) {
            throw new BusinessException(
                    "Cannot update a finalized bulk order (current status: " + current + ")");
        }
        if (next == BulkOrderStatus.PENDING) {
            throw new BusinessException("Cannot revert a bulk order back to PENDING");
        }
    }

    /**
     * Basic semantic validation of the inbound request before hitting the DB.
     */
    private void validateRequest(BulkOrderRequest request) {
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException("A bulk order must contain at least one item");
        }
    }

    /**
     * Generate a unique reference number for a bulk order.
     * Format: BLK-<random-hex-string> (max 20 chars to fit in DB column)
     * Ensures uniqueness by checking against existing refs in the database.
     */
    private String generateUniqueRef() {
        String ref;
        int attempts = 0;
        final int MAX_ATTEMPTS = 10;

        do {
            // Generate a unique ref using timestamp hash + random UUID suffix
            // Format: BLK-<6-char-hex> fits within 20 char column limit
            long timestamp = System.currentTimeMillis();
            String timestampHex = Long.toHexString(timestamp).substring(0, Math.min(4, Long.toHexString(timestamp).length())).toUpperCase();
            String randomPart = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
            ref = "BLK-" + timestampHex + randomPart;
            attempts++;

            if (attempts > MAX_ATTEMPTS) {
                throw new BusinessException("Failed to generate unique bulk order reference after multiple attempts");
            }
        } while (bulkOrderRepository.existsByRef(ref));

        return ref;
    }
}
