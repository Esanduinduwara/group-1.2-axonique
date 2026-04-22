package com.axonique_backend.axonique_backend.dto.response;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Getter;

/**
 * generic response envelope for all endpoints.
 *
 * Generics: wraps any payload type T.
 * SOLID S: only concerns itself with shaping the HTTP response body.
 */
@Getter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    private final boolean success;
    private final String message;
    private final T data;
    private final LocalDateTime timestamp;

    private ApiResponse(boolean success, String message, T data) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
    }

    // ----- Static factory methods (Encapsulate construction) -----

    public static <T> ApiResponse<T> ok(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, "Success", data);
    }

    public static <T> ApiResponse<T> created(T data) {
        return new ApiResponse<>(true, "Created successfully", data);
    }

    public static ApiResponse<Void> noContent(String message) {
        return new ApiResponse<>(true, message, null);
    }

    public static ApiResponse<Void> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
