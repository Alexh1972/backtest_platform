package com.backtest.repository;

import com.backtest.model.Session;
import com.backtest.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SessionRepository extends JpaRepository<Session, String> {
	public Session findByUser(User user);
}
