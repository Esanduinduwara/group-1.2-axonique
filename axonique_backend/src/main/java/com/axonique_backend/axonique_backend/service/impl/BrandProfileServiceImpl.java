package com.axonique_backend.axonique_backend.service.impl;

import com.axonique_backend.axonique_backend.dto.request.BrandProfileRequest;
import com.axonique_backend.axonique_backend.dto.response.BrandProfileResponse;
import com.axonique_backend.axonique_backend.model.BrandProfile;
import com.axonique_backend.axonique_backend.repository.BrandProfileRepository;
import com.axonique_backend.axonique_backend.service.interfaces.BrandProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class BrandProfileServiceImpl implements BrandProfileService {

    private final BrandProfileRepository brandProfileRepository;

    @Override
    public BrandProfileResponse getBrandProfile() {
        BrandProfile profile = brandProfileRepository.findById(1L)
                .orElseGet(() -> brandProfileRepository.save(new BrandProfile()));
        return toResponse(profile);
    }

    @Override
    public BrandProfileResponse updateBrandProfile(BrandProfileRequest request) {
        BrandProfile profile = brandProfileRepository.findById(1L)
                .orElseGet(() -> new BrandProfile());
        profile.setLogoUrl(request.getLogoUrl());
        profile.setHeroBannerUrl(request.getHeroBannerUrl());
        profile.setDiscountBannerText(request.getDiscountBannerText());
        profile.setDiscountBannerActive(request.isDiscountBannerActive());
        profile.setMission(request.getMission());
        profile.setVision(request.getVision());
        profile.setPolicies(request.getPolicies());
        BrandProfile saved = brandProfileRepository.save(profile);
        return toResponse(saved);
    }

    private BrandProfileResponse toResponse(BrandProfile p) {
        return BrandProfileResponse.builder()
                .id(p.getId())
                .logoUrl(p.getLogoUrl())
                .heroBannerUrl(p.getHeroBannerUrl())
                .discountBannerText(p.getDiscountBannerText())
                .discountBannerActive(p.isDiscountBannerActive())
                .mission(p.getMission())
                .vision(p.getVision())
                .policies(p.getPolicies())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
