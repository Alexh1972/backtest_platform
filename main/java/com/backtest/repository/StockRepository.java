package com.backtest.repository;

import com.backtest.dto.TickerDate;
import com.backtest.model.Stock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface StockRepository extends JpaRepository<Stock, Long> {
    @Query("SELECT new com.backtest.dto.TickerDate(s.ticker, MAX(s.intervalDate)) as maxDate FROM Stock s GROUP BY s.ticker")
    List<TickerDate> getLastDates();
}
