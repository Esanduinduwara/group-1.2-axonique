package com.axonique_backend.axonique_backend.dto.request;

import lombok.Data;

@Data
public class BrandProfileRequest {
    private String logoUrl;
    private String heroBannerUrl;
    private String discountBannerText;
    private boolean discountBannerActive;
    private String mission;
    private String vision;
    private String policies;
}
