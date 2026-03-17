package com.backtest.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock", indexes = {
        @Index(name = "idx_ticker_date", columnList = "ticker, intervalDate")
})
@IdClass(StockId.class)
public class Stock {
    @Id
    @Column(length = 10)
    private String ticker;

    @Id
    private LocalDateTime intervalDate;

    private Double open;
    private Double high;
    private Double low;
    private Double close;
    private Long volume;
    private Double dividends;
    private Double stockSplits;
}
