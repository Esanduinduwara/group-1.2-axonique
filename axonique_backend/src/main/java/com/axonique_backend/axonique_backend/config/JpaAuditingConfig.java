package com.axonique_backend.axonique_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables Spring Data JPA auditing.
 * This activates @CreatedDate and @LastModifiedDate in BaseEntity.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
    
}
