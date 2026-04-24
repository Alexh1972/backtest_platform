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

    @Query(value = "SELECT * FROM strategy_report s WHERE s.status = 'RUNNING' " +
            "AND (((CAST(SYS_EXTRACT_UTC(SYSTIMESTAMP) AS DATE) - TO_DATE('1970-01-01','YYYY-MM-DD')) * 86400000 - s.last_updated) >= 1200000 OR s.last_updated IS NULL)",
            nativeQuery = true)
    List<StrategyReport> getExpiredReports();
}
