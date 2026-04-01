package com.axonique_backend.axonique_backend.service.interfaces;

import com.axonique_backend.axonique_backend.dto.request.BrandProfileRequest;
import com.axonique_backend.axonique_backend.dto.response.BrandProfileResponse;

public interface BrandProfileService {
    BrandProfileResponse getBrandProfile();
    BrandProfileResponse updateBrandProfile(BrandProfileRequest request);
}
