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
public class SubmissionDetailResponse {
    String message;
    SubmissionView submission;
    ErrorResponse error;
    BaseResponse.ResponseStatus status;

    public SubmissionDetailResponse(ErrorResponse errorResponse) {
        status = BaseResponse.ResponseStatus.ERROR;
        this.error = errorResponse;
    }

    public SubmissionDetailResponse(SubmissionView submission) {
        status = BaseResponse.ResponseStatus.SUCCESS;
        this.submission = submission;
    }
}
