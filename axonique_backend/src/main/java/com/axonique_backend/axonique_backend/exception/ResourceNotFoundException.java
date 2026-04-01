package com.axonique_backend.axonique_backend.exception;

/**
 * thrown when an entity cannot be found by ID.
 *
 * Inheritance: extends RuntimeException (unchecked).
 * SOLID S: one exception type per failure mode; not a catch-all.
 */
public class ResourceNotFoundException extends RuntimeException {

    private final String resourceName;
    private final Long resourceId;

    public ResourceNotFoundException(String resourceName, Long id) {
        super(String.format("%s with id %d not found", resourceName, id));
        this.resourceName = resourceName;
        this.resourceId = id;
    }

    public String getResourceName() { return resourceName; }
    public Long getResourceId()     { return resourceId; }
}
