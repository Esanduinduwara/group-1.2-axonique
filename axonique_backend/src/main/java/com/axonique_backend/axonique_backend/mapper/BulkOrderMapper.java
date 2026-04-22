package com.axonique_backend.axonique_backend.mapper;

import com.axonique_backend.axonique_backend.dto.response.BulkOrderItemResponse;
import com.axonique_backend.axonique_backend.dto.response.BulkOrderResponse;
import com.axonique_backend.axonique_backend.model.BulkOrder;
import com.axonique_backend.axonique_backend.model.BulkOrderItem;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * BulkOrderMapper — converts BulkOrder / BulkOrderItem entities to
 * their outbound response DTOs.
 *
 * Mirrors the pattern used by OrderMapper:
 *   - @Component so Spring can inject it.
 *   - Pure functions — no side-effects, no DB calls.
 *
 * SOLID S: mapping logic is isolated here, not scattered across the service.
 */
@Component
public class BulkOrderMapper {

    /**
     * Map a BulkOrder entity to a BulkOrderResponse DTO.
     * Items collection is mapped only when it has been eagerly loaded;
     * a null / uninitialised proxy is treated as an empty list.
     */
    public BulkOrderResponse toResponse(BulkOrder order) {
        List<BulkOrderItemResponse> itemResponses = order.getItems() == null
                ? Collections.emptyList()
                : order.getItems().stream()
                        .map(this::toItemResponse)
                        .toList();

        return BulkOrderResponse.builder()
                .id(order.getId())
                .ref(order.getRef())
                .companyName(order.getCompanyName())
                .contactPerson(order.getContactPerson())
                .contactEmail(order.getContactEmail())
                .deliveryAddress(order.getDeliveryAddress())
                .notes(order.getNotes())
                .itemCount(itemResponses.size())
                .subtotal(order.getSubtotal())
                .discountAmount(order.getDiscountAmount())
                .total(order.getGrandTotal())
                .status(order.getStatus().name())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .build();
    }

    /**
     * Map a BulkOrderItem entity to a BulkOrderItemResponse DTO.
     */
    public BulkOrderItemResponse toItemResponse(BulkOrderItem item) {
        return BulkOrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                .productName(item.getProductName())
                .size(item.getSelectedSize())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .discountPercentage(item.getDiscountPct())
                .lineTotal(item.getLineTotal())
                .build();
    }
}
