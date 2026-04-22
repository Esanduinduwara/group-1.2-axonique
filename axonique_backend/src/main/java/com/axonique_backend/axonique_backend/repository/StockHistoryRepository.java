package com.axonique_backend.axonique_backend.repository;

import com.axonique_backend.axonique_backend.model.StockHistory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockHistoryRepository extends JpaRepository<StockHistory, Long> {
}