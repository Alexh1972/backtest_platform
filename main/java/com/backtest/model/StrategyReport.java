package com.backtest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Table(name = "strategy_report", indexes = {
        @Index(name = "idx_report_lookup", columnList = "tickers, start_date, end_date, file_hash")
})
@IdClass(StrategyReportId.class)
public class StrategyReport {
    @Id
    private String tickers;
    @Id
    private String startDate;
    @Id
    private String endDate;
    @Id
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
}
