package com.backtest.repository;

import com.backtest.dto.TickerDate;
import com.backtest.model.StrategyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StrategyReportRepository extends JpaRepository<StrategyReport, Long> {
    @Query("SELECT s FROM StrategyReport s where s.fileHash = ?1")
    List<StrategyReport> getReports(String hash);

    @Query("SELECT s FROM StrategyReport s where s.strategyReportId = ?1")
    List<StrategyReport> getReport(Long id);
}
