package com.backtest.repository;

import com.backtest.model.Submission;
import com.backtest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    @Query("SELECT s FROM Submission s WHERE s.user=?1 and s.hash=?2")
    Submission getSubmission(User user, String hash);

    @Query("SELECT s FROM Submission s WHERE s.user=?1")
    List<Submission> getSubmissions(User user);
}
