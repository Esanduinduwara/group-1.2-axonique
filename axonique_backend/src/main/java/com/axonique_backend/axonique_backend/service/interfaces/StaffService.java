package com.axonique_backend.axonique_backend.service.interfaces;

import com.axonique_backend.axonique_backend.dto.response.ProductResponse;
import com.axonique_backend.axonique_backend.dto.response.StaffActivityResponse;

import java.util.List;

public interface StaffService {
    StaffActivityResponse getActivity();
    List<ProductResponse> getLowStockProducts();
}
