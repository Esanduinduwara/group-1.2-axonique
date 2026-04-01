package com.axonique_backend.axonique_backend.config;

import com.axonique_backend.axonique_backend.model.Role;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Force Admin reset
        User admin = userRepository.findByUsername("admin").orElse(new User());
        admin.setUsername("admin");
        admin.setEmail("admin@axonique.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole(Role.ADMIN);
        admin.setEnabled(true);
        userRepository.save(admin);

        // Create or update Staff account
        userRepository.findByUsername("staff_1").ifPresentOrElse(
            user -> {
                user.setRole(Role.STAFF);
                user.setEnabled(true);
                userRepository.save(user);
            },
            () -> {
                User staff = User.builder()
                        .username("staff_1")
                        .email("staff1@axonique.com")
                        .password(passwordEncoder.encode("staff12345678"))
                        .role(Role.STAFF)
                        .enabled(true)
                        .build();
                userRepository.save(staff);
            }
        );
    }
}
