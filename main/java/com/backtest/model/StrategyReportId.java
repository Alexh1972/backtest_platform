package com.backtest.model;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Component;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Component
public class StrategyReportId {
    private String tickers;
    private String startDate;
    private String endDate;
    private String fileHash;
}
