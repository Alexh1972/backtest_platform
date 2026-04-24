package com.backtest.service;

import com.backtest.model.StrategyReport;
import com.backtest.repository.StrategyReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StrategyReportService {
    private final StrategyReportRepository strategyReportRepository;

    public StrategyReport save(StrategyReport strategyReport) {
        strategyReport.setLastUpdated(System.currentTimeMillis());

        return strategyReportRepository.save(strategyReport);
    }

    public List<StrategyReport> getReports(String hash) {
        return strategyReportRepository.getReports(hash);
    }

    public List<StrategyReport> getReport(Long id) {
        return strategyReportRepository.getReport(id);
    }

    public void delete(Long id) {
        strategyReportRepository.deleteById(id);
    }

    @Scheduled(fixedDelay = 1000 * 60 * 20, initialDelay = 1000 * 60)
    public void cleanStrategyReports() {
        List<StrategyReport> strategyReports = strategyReportRepository.getExpiredReports();

        for (StrategyReport strategyReport : strategyReports) {
            delete(strategyReport.getStrategyReportId());
        }
    }
}
