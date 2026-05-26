package com.backtest.dto.stock;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.springframework.stereotype.Component;

@Component
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class StockInfo {
    @JsonProperty("Open")
    private Double open;

    @JsonProperty("High")
    private Double high;

    @JsonProperty("Low")
    private Double low;

    @JsonProperty("Close")
    private Double close;

    @JsonProperty("Volume")
    private Long volume;

    @JsonProperty("Dividends")
    private Double dividends;

    @JsonProperty("Stock Splits")
    private Double StockSplits;
    @JsonProperty("Date")
    private String date;
}
