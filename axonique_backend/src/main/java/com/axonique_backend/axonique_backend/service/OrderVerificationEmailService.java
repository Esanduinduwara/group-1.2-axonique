package com.axonique_backend.axonique_backend.service;

import com.axonique_backend.axonique_backend.model.Order;

public interface OrderVerificationEmailService {
    void sendVerificationEmail(Order order, String verificationToken);
    void sendInvoiceEmail(Order order);
}
