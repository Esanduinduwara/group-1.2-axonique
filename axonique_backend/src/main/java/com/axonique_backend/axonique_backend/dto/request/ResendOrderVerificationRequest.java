package com.axonique_backend.axonique_backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResendOrderVerificationRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotBlank(message = "Customer email is required")
    @Email(message = "Valid email is required")
    private String customerEmail;
}
