package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.BrandProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BrandProfileRepository extends JpaRepository<BrandProfile, Long> {
}
