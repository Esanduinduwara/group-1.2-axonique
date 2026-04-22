package com.axonique_backend.axonique_backend.exception;

/**
 * thrown when a business rule is violated.
 *
 * SOLID S: separate from ResourceNotFoundException — different failure reason.
 */
public class BusinessException extends RuntimeException {
    
    public BusinessException(String message) {
        super(message);
    }
    
}
