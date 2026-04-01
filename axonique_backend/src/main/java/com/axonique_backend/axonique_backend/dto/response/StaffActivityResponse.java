package com.axonique_backend.axonique_backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffActivityResponse {
    private List<RecentOrder> recentOrders;
    private List<RecentRegistration> recentRegistrations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentOrder {
        private Long id;
        private String customerName;
        private BigDecimal total;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentRegistration {
        private Long id;
        private String username;
        private String email;
        private LocalDateTime createdAt;
    }
}
