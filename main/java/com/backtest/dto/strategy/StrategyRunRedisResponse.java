package com.backtest.dto.strategy;

import com.backtest.dto.stock.StockTopicRedisResponse;
import com.backtest.model.StrategyReport;
import lombok.*;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrategyRunRedisResponse {
    private Long id;
    private String tickers;
    private String startDate;
    private String endDate;
    private String fileHash;

    private Double fullReturn;
    private Double annualizedReturn;
    private Double dailyReturn;
    private Double annualRisk;
    private Double dailyRisk;
    private Double sharpeRatio;
    private Double sortinoRatio;
    private Double maxDrawdown;
    private Double calmarRatio;
    private Double beta;
    private Double alpha;
    private Double var95;
    private Double skewness;
    private Double kurtosis;

    private boolean success;
    private String error;

    @SneakyThrows
    public static StrategyRunRedisResponse fromJson(String json) {
        return new ObjectMapper().readValue(json, StrategyRunRedisResponse.class);
    }

    public StrategyReport toEntity() {
        StrategyReport entity = new StrategyReport();

        if (this.id != null && this.id != 0) {
            entity.setStrategyReportId(this.id);
        }

        entity.setTickers(this.tickers != null ? this.tickers : "");
        entity.setFileHash(this.fileHash != null ? this.fileHash : "");

        if (this.startDate != null && !this.startDate.isEmpty()) {
            entity.setStartDate(parseToUtcLocalDateTime(this.startDate));
        }
        if (this.endDate != null && !this.endDate.isEmpty()) {
            entity.setEndDate(parseToUtcLocalDateTime(this.endDate));
        }

        entity.setFullReturn(getValue(this.fullReturn));
        entity.setAnnualizedReturn(getValue(this.annualizedReturn));
        entity.setDailyReturn(getValue(this.dailyReturn));
        entity.setAnnualRisk(getValue(this.annualRisk));
        entity.setDailyRisk(getValue(this.dailyRisk));
        entity.setSharpeRatio(getValue(this.sharpeRatio));
        entity.setSortinoRatio(getValue(this.sortinoRatio));
        entity.setMaxDrawdown(getValue(this.maxDrawdown));
        entity.setCalmarRatio(getValue(this.calmarRatio));
        entity.setBeta(getValue(this.beta));
        entity.setAlpha(getValue(this.alpha));
        entity.setVar95(getValue(this.var95));
        entity.setSkewness(getValue(this.skewness));
        entity.setKurtosis(getValue(this.kurtosis));

        return entity;
    }

    private LocalDateTime parseToUtcLocalDateTime(String dateStr) {
        try {
            return OffsetDateTime.parse(dateStr.replace(" ", "T"))
                    .withOffsetSameInstant(ZoneOffset.UTC)
                    .toLocalDateTime();
        } catch (Exception e) {
            return LocalDateTime.of(1970, 1, 1, 0, 0);
        }
    }

    private double getValue(Double val) {
        return val != null ? val : 0.0;
    }
}
