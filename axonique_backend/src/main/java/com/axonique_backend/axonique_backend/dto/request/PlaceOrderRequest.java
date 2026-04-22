package com.axonique_backend.axonique_backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

/**
 * customer submits this to create an order from their cart.
 *
 * SOLID S: only carries the data needed to place an order.
 * OOP Encapsulation: nested list of CartItemRequests validated with @Valid.
 */
@Data
public class PlaceOrderRequest {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String customerEmail;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    @NotEmpty(message = "Cart cannot be empty")
    @Valid
    private List<CartItemRequest> items;
}
