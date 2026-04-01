package com.axonique_backend.axonique_backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "brand_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BrandProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "LONGTEXT")
    private String logoUrl;

    @Column(columnDefinition = "LONGTEXT")
    private String heroBannerUrl;

    @Column(length = 500)
    private String discountBannerText;

    @Builder.Default
    private boolean discountBannerActive = false;

    @Column(columnDefinition = "TEXT")
    private String mission;

    @Column(columnDefinition = "TEXT")
    private String vision;

    @Column(columnDefinition = "TEXT")
    private String policies;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
