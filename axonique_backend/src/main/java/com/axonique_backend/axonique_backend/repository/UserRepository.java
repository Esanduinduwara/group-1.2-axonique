package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u ORDER BY u.id DESC")
    List<User> findAllOrderByIdDesc();

    @Query("SELECT u FROM User u ORDER BY u.id DESC")
    List<User> findRecentRegistrations(org.springframework.data.domain.Pageable pageable);
}
