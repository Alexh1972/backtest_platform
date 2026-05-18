package com.backtest.dto.strategy;

import com.backtest.model.Submission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SubmissionDto {
    private String hash;
    private Long createdAt;

    public static SubmissionDto from(Submission s) {
        return new SubmissionDto(s.getHash(), s.getCreatedAt());
    }
}
