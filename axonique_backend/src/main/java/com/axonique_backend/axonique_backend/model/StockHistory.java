package com.axonique_backend.axonique_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long productId;
    private String variant;
    private Integer quantityChanged;
    private String action; // e.g., "SALE_DEDUCTION", "MANUAL_ADD"
    private String reason;
    private LocalDateTime timestamp;
}