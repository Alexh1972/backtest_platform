package com.backtest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@AllArgsConstructor
@Data
public class StrategyReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long strategyReportId;
    private String tickers;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String fileHash;

    private double fullReturn;
    private double annualizedReturn;
    private double dailyReturn;
    private double annualRisk;
    private double dailyRisk;
    private double sharpeRatio;
    private double sortinoRatio;
    private double maxDrawdown;
    private double calmarRatio;
    private double beta;
    private double alpha;
    private double var95;
    private double skewness;
    private double kurtosis;
    private Long lastUpdated;

    @Enumerated(EnumType.STRING)
    private StrategyReportStatus status = StrategyReportStatus.RUNNING;


    public enum StrategyReportStatus {
        RUNNING, COMPLETED;
    }

    public StrategyReport() {
        this.strategyReportId = 0L;

        this.tickers = "";
        this.fileHash = "";

        this.startDate = LocalDateTime.of(1970, 1, 1, 0, 0);
        this.endDate = LocalDateTime.of(1970, 1, 1, 0, 0);

        this.fullReturn = 0.0;
        this.annualizedReturn = 0.0;
        this.dailyReturn = 0.0;
        this.annualRisk = 0.0;
        this.dailyRisk = 0.0;
        this.sharpeRatio = 0.0;
        this.sortinoRatio = 0.0;
        this.maxDrawdown = 0.0;
        this.calmarRatio = 0.0;
        this.beta = 0.0;
        this.alpha = 0.0;
        this.var95 = 0.0;
        this.skewness = 0.0;
        this.kurtosis = 0.0;
        lastUpdated = System.currentTimeMillis();
    }
}
