package com.axonique_backend.axonique_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistrationDto {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Confirm Password is required")
    private String confirmPassword;

    @NotBlank(message = "Security Question 1 is required")
    private String securityQuestion1;

    @NotBlank(message = "Security Answer 1 is required")
    private String securityAnswer1;

    @NotBlank(message = "Security Question 2 is required")
    private String securityQuestion2;

    @NotBlank(message = "Security Answer 2 is required")
    private String securityAnswer2;

    @NotBlank(message = "Security Question 3 is required")
    private String securityQuestion3;

    @NotBlank(message = "Security Answer 3 is required")
    private String securityAnswer3;
}
