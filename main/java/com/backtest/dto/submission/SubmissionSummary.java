package com.backtest.dto.submission;

import com.backtest.model.StrategyReport;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionSummary {
    String hash;
    StrategyReport report;
}
