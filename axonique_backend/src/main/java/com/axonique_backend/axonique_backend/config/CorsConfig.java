package com.axonique_backend.axonique_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

/**
 * S: CORS is its own infrastructure concern, not mixed into controllers.
 */
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsFilter corsFilter() {
    CorsConfiguration config = new CorsConfiguration();
    config.addAllowedOriginPattern("http://localhost:*"); //dev
    config.addAllowedOriginPattern("https://*.axonique.com"); //prod
    config.addAllowedOriginPattern("https://*.axonique.store"); //prod
    config.addAllowedOriginPattern("https://*.vercel.app"); //vercel
    config.addAllowedMethod("*"); // Allow all HTTP methods
    config.addAllowedHeader("*"); // Allow all headers
    config.setAllowCredentials(true); 

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return new CorsFilter(source);
    }
}

