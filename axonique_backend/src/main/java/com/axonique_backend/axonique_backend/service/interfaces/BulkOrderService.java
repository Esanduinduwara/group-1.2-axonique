package com.axonique_backend.axonique_backend.service.interfaces;

import com.axonique_backend.axonique_backend.controller.BulkOrderController.BulkOrderRequest;
import com.axonique_backend.axonique_backend.dto.response.BulkOrderResponse;
import com.axonique_backend.axonique_backend.model.BulkOrderStatus;

import java.util.List;

/**
 * BulkOrderService — business-logic contract for bulk order management.
 *
 * SOLID D: BulkOrderController depends on this interface, not the impl.
 * SOLID S: only bulk-order use-cases live here.
 */
public interface BulkOrderService {

    /**
     * Create a new bulk order for the authenticated retailer.
     *
     * @param request       validated inbound DTO
     * @param username      username resolved from the JWT principal
     * @return              persisted order as a response DTO
     */
    BulkOrderResponse createBulkOrder(BulkOrderRequest request, String username);

    /**
     * Retrieve all bulk orders placed by the authenticated retailer,
     * ordered by creation date descending.
     *
     * @param username  username resolved from the JWT principal
     * @return          list of response DTOs (may be empty, never null)
     */
    List<BulkOrderResponse> getMyBulkOrders(String username);

    /**
     * Retrieve a single bulk order by its database ID.
     * Throws ResourceNotFoundException if the order does not exist.
     *
     * @param id    primary key
     * @return      response DTO
     */
    BulkOrderResponse getBulkOrderById(Long id);

    /**
     * Retrieve all bulk orders from all retailers (admin use).
     * Ordered by creation date descending.
     *
     * @return  list of response DTOs (may be empty, never null)
     */
    List<BulkOrderResponse> getAllBulkOrders();

    /**
     * Update the status of an existing bulk order.
     * Throws ResourceNotFoundException if the order does not exist,
     * BusinessException if the status transition is invalid.
     *
     * @param id        primary key of the order
     * @param status    target status
     */
    void updateBulkOrderStatus(Long id, BulkOrderStatus status);
}
