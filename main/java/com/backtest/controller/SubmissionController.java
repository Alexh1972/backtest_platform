package com.backtest.controller;

import com.backtest.annotations.RequireAuth;
import com.backtest.dto.ErrorResponse;
import com.backtest.dto.submission.SubmissionComparisonResponse;
import com.backtest.dto.submission.SubmissionDetailResponse;
import com.backtest.dto.submission.SubmissionListResponse;
import com.backtest.dto.submission.SubmissionSummary;
import com.backtest.dto.submission.SubmissionView;
import com.backtest.model.StrategyReport;
import com.backtest.model.Submission;
import com.backtest.model.User;
import com.backtest.service.StrategyReportService;
import com.backtest.service.SubmissionService;
import com.backtest.util.AuthUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/submission")
@RequiredArgsConstructor
@Slf4j
public class SubmissionController {
    @Autowired
    private final SubmissionService submissionService;

    @Autowired
    private final StrategyReportService strategyReportService;

    @GetMapping
    @RequireAuth
    public SubmissionListResponse getSubmissions(HttpServletRequest request) {
        User user = AuthUtil.getUser(request);

        List<Submission> submissions = submissionService.getSubmissions(user);

        if (submissions == null || submissions.isEmpty()) {
            return new SubmissionListResponse("No submissions found.", new ArrayList<>());
        }

        List<SubmissionSummary> summaries = new ArrayList<>();
        for (Submission submission : submissions) {
            StrategyReport report = strategyReportService.getLatestReport(submission.getHash());
            summaries.add(new SubmissionSummary(submission.getHash(), report));
        }

        return new SubmissionListResponse("Submissions retrieved successfully.", summaries);
    }

    @GetMapping("/{hash}")
    @RequireAuth
    public SubmissionDetailResponse getSubmission(HttpServletRequest request, @PathVariable String hash) {
        User user = AuthUtil.getUser(request);

        SubmissionView view = buildSubmissionView(user, hash);

        if (view == null) {
            return new SubmissionDetailResponse(new ErrorResponse("Submission not found!"));
        }

        return new SubmissionDetailResponse(view);
    }

    @GetMapping("/compare")
    @RequireAuth
    public SubmissionComparisonResponse compareSubmissions(HttpServletRequest request,
                                                           @RequestParam("first") String firstHash,
                                                           @RequestParam("second") String secondHash) {
        User user = AuthUtil.getUser(request);

        SubmissionView first = buildSubmissionView(user, firstHash);
        if (first == null) {
            return new SubmissionComparisonResponse(new ErrorResponse("Submission not found!", firstHash));
        }

        SubmissionView second = buildSubmissionView(user, secondHash);
        if (second == null) {
            return new SubmissionComparisonResponse(new ErrorResponse("Submission not found!", secondHash));
        }

        return new SubmissionComparisonResponse(first, second);
    }

    private SubmissionView buildSubmissionView(User user, String hash) {
        Submission submission = submissionService.getSubmission(user, hash);

        if (submission == null) {
            return null;
        }

        String code = readSubmissionCode(hash);
        StrategyReport report = strategyReportService.getLatestReport(hash);

        return new SubmissionView(submission.getHash(), code, report);
    }

    private String readSubmissionCode(String hash) {
        Path path = Paths.get("storage/scripts/" + hash + ".py");

        try {
            if (Files.exists(path)) {
                return Files.readString(path, StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.error("Error while reading submission code for hash {}!", hash, e);
        }

        return null;
    }
}
