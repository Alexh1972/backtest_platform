package com.backtest.service;

import com.backtest.model.Submission;
import com.backtest.model.User;
import com.backtest.repository.StrategyReportRepository;
import com.backtest.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubmissionService {
    private final SubmissionRepository submissionRepository;
    private final StrategyReportRepository strategyReportRepository;

    public Submission getSubmission(User user, String hash) {
        return submissionRepository.getSubmission(user, hash);
    }

    public Submission save(Submission submission) {
        return submissionRepository.saveAndFlush(submission);
    }

    public void delete(Submission submission) {
        submissionRepository.delete(submission);
    }

    // Submissions ordered by most recent run first; never-run submissions fall
    // to the bottom (tie-broken by creation time, newest first).
    public List<Submission> getSubmissions(User user) {
        List<Submission> submissions = submissionRepository.getSubmissions(user);
        if (submissions.isEmpty()) {
            return submissions;
        }

        List<String> hashes = submissions.stream().map(Submission::getHash).toList();
        Map<String, Long> lastRun = new HashMap<>();
        for (Object[] row : strategyReportRepository.getLastRunByHashes(hashes)) {
            if (row[1] != null) {
                lastRun.put((String) row[0], ((Number) row[1]).longValue());
            }
        }

        submissions.sort(
                Comparator.comparingLong((Submission s) -> lastRun.getOrDefault(s.getHash(), Long.MIN_VALUE))
                        .reversed()
                        .thenComparing(Comparator.comparingLong(Submission::getCreatedAt).reversed())
        );
        return submissions;
    }

}
