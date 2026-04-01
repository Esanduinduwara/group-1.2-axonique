package com.axonique_backend.axonique_backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordDto {
    @NotBlank(message = "Current password is required")
    private String currentPassword;

    @NotBlank(message = "New password is required")
    private String newPassword;

    @NotBlank(message = "Please confirm your new password")
    private String confirmNewPassword;

    @NotBlank(message = "Security question selection is required")
    private String securityQuestion;

    @NotBlank(message = "Security answer is required")
    private String securityAnswer;
}
