package com.axonique_backend.axonique_backend.service.interfaces;
import java.util.List;

import com.axonique_backend.axonique_backend.dto.request.ProductRequest;
import com.axonique_backend.axonique_backend.dto.response.ProductResponse;

/**
 * interface defining the product feature contract.
 *
 * SOLID I (Interface Segregation): focused only on product operations.
 *   Cart and order operations are in their own interfaces.
 *
 * SOLID D (Dependency Inversion): controllers depend on this abstraction,
 *   not on ProductServiceImpl directly. Swapping the implementation
 *   (e.g. for testing) requires no changes to the controller.
 *
 * SOLID O (Open/Closed): new product features can be added via new methods
 *   or a new interface — existing code is not changed.
 */
public interface ProductService {

    List<ProductResponse> getAllProducts();

    List<String> getCategories();

    List<ProductResponse> getProductsByCategory(String category);

    List<ProductResponse> getInStockProducts();

    ProductResponse getProductById(Long id);

    ProductResponse createProduct(ProductRequest request);

    ProductResponse updateProduct(Long id, ProductRequest request);

    void deleteProduct(Long id);
}

