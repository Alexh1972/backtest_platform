package com.backtest.dto.submission;

import com.backtest.dto.BaseResponse;
import com.backtest.dto.ErrorResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionComparisonResponse {
    String message;
    SubmissionView submissionA;
    SubmissionView submissionB;
    ErrorResponse error;
    BaseResponse.ResponseStatus status;

    public SubmissionComparisonResponse(ErrorResponse errorResponse) {
        status = BaseResponse.ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public SubmissionComparisonResponse(SubmissionView submissionA, SubmissionView submissionB) {
        status = BaseResponse.ResponseStatus.SUCCESS;
        this.submissionA = submissionA;
        this.submissionB = submissionB;
    }
}
