package com.backtest.dto.stock;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.stereotype.Component;

@Component
@Data
public class StockInfo {
    private Double Open;
    private Double High;
    private Double Low;
    private Double Close;
    private Long Volume;
    private Double Dividends;

    @JsonProperty("Stock Splits")
    private Double StockSplits;
    private String Date;
}
