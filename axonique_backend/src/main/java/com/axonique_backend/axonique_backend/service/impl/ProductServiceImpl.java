package com.axonique_backend.axonique_backend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.axonique_backend.axonique_backend.dto.request.ProductRequest;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.exception.ResourceNotFoundException;
import com.axonique_backend.axonique_backend.mapper.ProductMapper;
import com.axonique_backend.axonique_backend.model.Product;
import com.axonique_backend.axonique_backend.repository.ProductRepository;
import com.axonique_backend.axonique_backend.service.interfaces.ProductService;

import java.util.List;

/**
 * ProductServiceImpl — concrete implementation of ProductService.
 *
 * SOLID L (Liskov Substitution): this class can replace ProductService
 *   anywhere without breaking callers.
 * SOLID D (Dependency Inversion): depends on the ProductRepository interface
 *   and ProductMapper — not concrete DAOs.
 * SOLID S: only handles product CRUD business logic.
 *
 * OOP:
 *  - Encapsulation: repository and mapper are private final fields.
 *  - Polymorphism: implements ProductService; can be replaced by a mock in tests.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductMapper productMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getCategories() {
        return productRepository.findDistinctCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getProductsByCategory(String category) {
        return productRepository.findByCategory(category)
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getInStockProducts() {
        return productRepository.findByInStockTrue()
                .stream()
                .map(productMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        Product product = findProductOrThrow(id);
        return productMapper.toResponse(product);
    }

    @Override
    public ProductResponse createProduct(ProductRequest request) {
        Product product = productMapper.toEntity(request);
        Product saved = productRepository.save(product);
        return productMapper.toResponse(saved);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product existing = findProductOrThrow(id);
        productMapper.updateEntity(existing, request);
        Product updated = productRepository.save(existing);
        return productMapper.toResponse(updated);
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = findProductOrThrow(id);
        productRepository.delete(product);
    }

    // ----- Private helpers -----

    /**
     * Encapsulation: the "find or throw" pattern is reused internally
     * and hidden from callers.
     */
    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }
}
