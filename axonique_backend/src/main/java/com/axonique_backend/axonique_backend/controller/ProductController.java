package com.axonique_backend.axonique_backend.controller;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import com.axonique_backend.axonique_backend.dto.request.ProductRequest;
import com.axonique_backend.axonique_backend.dto.response.ApiResponse;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.service.interfaces.ProductService;
import org.springframework.web.bind.annotation.PutMapping;


/**
 * REST controller for the product catalogue.
 *
 * SOLID S (Single Responsibility): handles HTTP input/output only. All business logic is delegated to ProductService.
 * SOLID D (Dependency Inversion): depends on ProductService interface, not ProductServiceImpl.
 *
 * Encapsulation: request parsing and response wrapping are hidden from the service layer.
 *
 * Base URL: /api/products
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {
    
    private final ProductService productService;

    /**
     * GET /api/products
     * GET /api/products?category=Hoodies
     * GET /api/products?inStock=true
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) Boolean inStock){

            List<ProductResponse> products;

            if (category != null && !category.isBlank()) {
                products = productService.getProductsByCategory(category);
            } else if (Boolean.TRUE.equals(inStock)) {
                products = productService.getInStockProducts();
            } else {
                products = productService.getAllProducts();
            }
            return ResponseEntity.ok(ApiResponse.ok("Products retrieved", products));
        } 

   /**
     * GET /api/products/{id} 
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getProducts(@PathVariable Long id) {
        ProductResponse product = productService.getProductById(id);
        return ResponseEntity.ok(ApiResponse.ok("Product retrieved",product));
    }
    
    /**  
     * POST /api/products
     * Admin: create a new product.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse created = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(created));
    }

    /**
     * PUT /api/products/{id}
     * Admin: update an existing product.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid 
            @RequestBody ProductRequest request) {
        ProductResponse updated = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Product updated", updated));
    }

    /**
     * DELETE /api/products/{id}
     * Admin: remove a product.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.noContent("Product deleted"));
    }

    /**
     * GET /api/products/categories
     * Returns distinct list of category strings.
     */
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<String>>> getCategories() {
        List<String> categories = productService.getCategories();
        return ResponseEntity.ok(ApiResponse.ok("Categories retrieved", categories));
    }

    private final com.axonique_backend.axonique_backend.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/seed-admin")
    public String seedAdmin() {
        if (!userRepository.existsByUsername("admin_root")) {
            com.axonique_backend.axonique_backend.model.User admin = com.axonique_backend.axonique_backend.model.User.builder()
                    .username("admin_root")
                    .email("admin_root@axonique.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(com.axonique_backend.axonique_backend.model.Role.ADMIN)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            return "Admin created!";
        }
        return "Admin already exists!";
    }
}

