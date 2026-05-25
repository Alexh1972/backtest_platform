package com.backtest.dto.submission;

import com.backtest.dto.BaseResponse;
import com.backtest.dto.ErrorResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionListResponse {
    String message;
    List<SubmissionSummary> submissions;
    ErrorResponse error;
    BaseResponse.ResponseStatus status;

    public SubmissionListResponse(ErrorResponse errorResponse) {
        status = BaseResponse.ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public SubmissionListResponse(String message, List<SubmissionSummary> submissions) {
        status = BaseResponse.ResponseStatus.SUCCESS;
        this.message = message;
        this.submissions = submissions;
    }
}
