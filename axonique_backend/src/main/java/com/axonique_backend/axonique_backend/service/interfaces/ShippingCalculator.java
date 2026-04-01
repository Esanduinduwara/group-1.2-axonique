package com.axonique_backend.axonique_backend.service.interfaces;
import java.math.BigDecimal;

import org.springframework.stereotype.Component;

/**
 * encapsulates shipping fee business logic.
 *
 * SOLID S (Single Responsibility): fee calculation is its own concern,
 *   extracted from OrderService so it can change independently.
 *
 * SOLID O (Open/Closed): to change the fee structure, extend this class
 *   or swap it — no other class needs to change.
 *
 * Encapsulation: the threshold and fee amounts are private constants.
 */
@Component
public class ShippingCalculator {

    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("10000");
    private static final BigDecimal STANDARD_SHIPPING_FEE  = new BigDecimal("350");

    public BigDecimal calculate(BigDecimal subtotal) {
        if (subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO;
        }
        return STANDARD_SHIPPING_FEE;
    }
}
