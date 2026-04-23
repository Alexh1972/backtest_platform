package com.backtest.service;

import com.backtest.model.StrategyReport;
import com.backtest.repository.StrategyReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StrategyReportService {
    private final StrategyReportRepository strategyReportRepository;

    public StrategyReport save(StrategyReport strategyReport) {
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
}
