package com.axonique_backend.axonique_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

        private final JwtAuthenticationFilter jwtAuthFilter;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**")
                                                .permitAll()
                                                .requestMatchers("/api/auth/**").permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/products/**")
                                                .permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/admin/dashboard/metrics")
                                                .permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/products", "/api/products/**")
                                                .hasAnyRole("ADMIN", "STAFF")
                                                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                                                "/api/products", "/api/products/**")
                                                .hasAnyRole("ADMIN", "STAFF")
                                                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                                                "/api/products", "/api/products/**")
                                                .hasAnyRole("ADMIN", "STAFF")
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/brand")
                                                .permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/orders")
                                                .permitAll()
                                                .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "STAFF")
                                                .requestMatchers("/api/staff/**").hasAnyRole("ADMIN", "STAFF")
                                                .anyRequest().authenticated())
                                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
                return http.build();
        }

        @Bean
        public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
                org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
                configuration.setAllowedOrigins(
                                java.util.Arrays.asList("http://localhost:5173", "http://127.0.0.1:5173"));
                configuration.setAllowedMethods(
                                java.util.Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
                configuration.setAllowedHeaders(java.util.Arrays.asList("Authorization", "Content-Type",
                                "X-Requested-With",
                                "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
                configuration.setExposedHeaders(
                                java.util.Arrays.asList("Access-Control-Allow-Origin",
                                                "Access-Control-Allow-Credentials"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(3600L);

                org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}
