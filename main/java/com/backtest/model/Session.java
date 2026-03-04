package com.backtest.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity(name = "user_session")
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Session {
    @Id
    String token;

    @OneToOne
    @JoinColumn(name = "user_id")
    User user;

    String ipAddress;
}
