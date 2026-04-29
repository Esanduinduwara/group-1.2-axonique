package com.axonique_backend.axonique_backend.controller;

import com.axonique_backend.axonique_backend.dto.RegistrationDto;
import com.axonique_backend.axonique_backend.service.CodeGeneratorService;
import com.axonique_backend.axonique_backend.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.axonique_backend.axonique_backend.dto.LoginDto;
import com.axonique_backend.axonique_backend.model.User;
import com.axonique_backend.axonique_backend.config.JwtUtils;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;
    private final JwtUtils jwtUtils;
    private final CodeGeneratorService codeGeneratorService;

    @PostMapping("/register/{code}")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationDto registrationDto, @PathVariable("code") String code) {

        if(codeGeneratorService.validateCode(registrationDto.getEmail(), code)){
        
            try {
                registrationService.registerUser(registrationDto);
                return ResponseEntity.ok("User registered successfully!");
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(e.getMessage());
            } catch (Exception e) {
                return ResponseEntity.internalServerError()
                        .body("An error occurred during registration: " + e.getMessage());
            }
        } else {
            return new ResponseEntity<>("Invalid Verification Code!!",HttpStatus.UNAUTHORIZED);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginDto loginDto) {
        try {
            User user = registrationService.loginUser(loginDto.getUsername(), loginDto.getPassword());
            String roleName = user.getRole() != null ? user.getRole().name() : "CUSTOMER";
            String token = jwtUtils.generateToken(user.getUsername(), roleName);

            return ResponseEntity.ok(com.axonique_backend.axonique_backend.dto.LoginResponse.builder()
                    .id(user.getId())
                    .token(token)
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .role(roleName)
                    .authorities(java.util.List.of("ROLE_" + roleName))
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("An error occurred during login: " + e.getMessage());
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody com.axonique_backend.axonique_backend.dto.ChangePasswordDto changePasswordDto,
            @org.springframework.security.core.annotation.AuthenticationPrincipal org.springframework.security.core.userdetails.UserDetails userDetails) {
        try {
            registrationService.changePassword(userDetails.getUsername(), changePasswordDto);
            return ResponseEntity.ok("Password changed successfully!");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("An error occurred: " + e.getMessage());
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(
            @Valid @RequestBody com.axonique_backend.axonique_backend.dto.ResetPasswordDto resetPasswordDto) {
        try {
            registrationService.resetPassword(resetPasswordDto);
            return ResponseEntity.ok("Password has been reset successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
