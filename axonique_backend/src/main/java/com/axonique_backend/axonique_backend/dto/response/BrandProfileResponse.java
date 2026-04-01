package com.axonique_backend.axonique_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandProfileResponse {
    private Long id;
    private String logoUrl;
    private String heroBannerUrl;
    private String discountBannerText;
    private boolean discountBannerActive;
    private String mission;
    private String vision;
    private String policies;
    private LocalDateTime updatedAt;
}
