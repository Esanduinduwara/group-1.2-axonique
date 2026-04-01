package com.axonique_backend.axonique_backend.service;

import com.axonique_backend.axonique_backend.dto.RegistrationDto;
import com.axonique_backend.axonique_backend.dto.ResetPasswordDto;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.scheduling.annotation.Async;
import com.axonique_backend.axonique_backend.dto.ChangePasswordDto;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegistrationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Transactional
    public void registerUser(RegistrationDto registrationDto) {
        if (!registrationDto.getPassword().equals(registrationDto.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }

        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        User user = User.builder()
                .username(registrationDto.getUsername())
                .email(registrationDto.getEmail())
                .password(passwordEncoder.encode(registrationDto.getPassword()))
                .securityQuestion1(registrationDto.getSecurityQuestion1())
                .securityAnswer1(passwordEncoder.encode(registrationDto.getSecurityAnswer1().toLowerCase()))
                .securityQuestion2(registrationDto.getSecurityQuestion2())
                .securityAnswer2(passwordEncoder.encode(registrationDto.getSecurityAnswer2().toLowerCase()))
                .securityQuestion3(registrationDto.getSecurityQuestion3())
                .securityAnswer3(passwordEncoder.encode(registrationDto.getSecurityAnswer3().toLowerCase()))
                .enabled(true)
                .build();

        userRepository.save(user);
        // Email sending disabled per user request, but logic preserved
        // sendConfirmationEmail(user.getEmail(), user.getUsername());
    }

    public User loginUser(String identifier, String password) {
        log.info("Attempting login for identifier: {}", identifier);

        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> {
                    log.warn("Login failed: User not found for identifier {}", identifier);
                    return new IllegalArgumentException("Invalid username or password");
                });

        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Login failed: Password mismatch for user {}", identifier);
            throw new IllegalArgumentException("Invalid username or password");
        }

        log.info("Login successful for user: {}", identifier);
        return user;
    }

    @Async
    protected void sendConfirmationEmail(String to, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Registration Successful - AxoNique");
            message.setText("Dear " + username
                    + ",\n\nWelcome to AxoNique! Your registration was successful.\n\nBest regards,\nThe AxoNique Team");
            mailSender.send(message);
            log.info("Confirmation email sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send confirmation email to {}: {}", to, e.getMessage());
        }
    }

    @Transactional
    public void changePassword(String username, ChangePasswordDto dto) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid current password");
        }

        // Verify security answer
        String storedAnswer = null;
        if (dto.getSecurityQuestion().equals(user.getSecurityQuestion1())) {
            storedAnswer = user.getSecurityAnswer1();
        } else if (dto.getSecurityQuestion().equals(user.getSecurityQuestion2())) {
            storedAnswer = user.getSecurityAnswer2();
        } else if (dto.getSecurityQuestion().equals(user.getSecurityQuestion3())) {
            storedAnswer = user.getSecurityAnswer3();
        } else {
            throw new IllegalArgumentException("Invalid security question selection");
        }

        if (!passwordEncoder.matches(dto.getSecurityAnswer().toLowerCase(), storedAnswer)) {
            throw new IllegalArgumentException("Incorrect security answer");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmNewPassword())) {
            throw new IllegalArgumentException("New passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", username);
    }

    @Transactional
    public void resetPassword(ResetPasswordDto dto) {
        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid details provided"));

        int verifiedCount = 0;

        // Check if question 1 is one of the user's questions and matches
        if (isVerified(user, dto.getSecurityQuestion1(), dto.getSecurityAnswer1())) {
            verifiedCount++;
        }

        // Check if question 2 is one of the user's questions and matches
        if (isVerified(user, dto.getSecurityQuestion2(), dto.getSecurityAnswer2())) {
            verifiedCount++;
        }

        if (verifiedCount < 2) {
            log.warn("Password reset failed: Security verification failed for email: {}", dto.getEmail());
            throw new IllegalArgumentException("Invalid details provided");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmNewPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
        log.info("Password reset successfully for email: {}", dto.getEmail());
    }

    private boolean isVerified(User user, String question, String answer) {
        String storedAnswer = null;

        if (question.equals(user.getSecurityQuestion1())) {
            storedAnswer = user.getSecurityAnswer1();
        } else if (question.equals(user.getSecurityQuestion2())) {
            storedAnswer = user.getSecurityAnswer2();
        } else if (question.equals(user.getSecurityQuestion3())) {
            storedAnswer = user.getSecurityAnswer3();
        }

        if (storedAnswer == null) {
            return false;
        }

        return passwordEncoder.matches(answer.toLowerCase(), storedAnswer);
    }

    public String[] getUserSecurityQuestions(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return new String[] {
                user.getSecurityQuestion1(),
                user.getSecurityQuestion2(),
                user.getSecurityQuestion3()
        };
    }
}
