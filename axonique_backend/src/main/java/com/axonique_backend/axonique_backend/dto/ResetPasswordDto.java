package com.axonique_backend.axonique_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ResetPasswordDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "New password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String newPassword;

    @NotBlank(message = "Confirm password is required")
    private String confirmNewPassword;

    @NotBlank(message = "Security Question 1 selection is required")
    private String securityQuestion1;

    @NotBlank(message = "Security Answer 1 is required")
    private String securityAnswer1;

    @NotBlank(message = "Security Question 2 selection is required")
    private String securityQuestion2;

    @NotBlank(message = "Security Answer 2 is required")
    private String securityAnswer2;
}
