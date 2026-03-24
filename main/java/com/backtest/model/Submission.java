package com.backtest.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "submission", indexes = {
        @Index(name = "idx_user_hash", columnList = "user_id, hash")
})
@IdClass(SubmissionId.class)
public class Submission {
    @ManyToOne
    @JoinColumn(name = "user_id")
    @Id
    User user;

    @Id
    String hash;
}
