package com.backtest.service;

import com.backtest.model.Submission;
import com.backtest.model.User;
import com.backtest.repository.StockRepository;
import com.backtest.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class SubmissionService {
    private final SubmissionRepository submissionRepository;

    public Submission getSubmission(User user, String hash) {
        return submissionRepository.getSubmission(user, hash);
    }

    public Submission save(Submission submission) {
        return submissionRepository.saveAndFlush(submission);
    }

    public List<Submission> getSubmissions(User user) {
        return submissionRepository.getSubmissions(user);
    }
}
