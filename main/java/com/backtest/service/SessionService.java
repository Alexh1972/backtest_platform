package com.backtest.service;

import com.backtest.model.Session;
import com.backtest.model.User;
import com.backtest.repository.SessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class SessionService {
    private final SessionRepository sessionRepository;
    private final UserService userService;
    public void saveSession(Session session) {
        Optional<Session> oldSessionOptional = getSessionByUser(session.getUser());
        if (oldSessionOptional.isPresent()) {
            Session oldSession = oldSessionOptional.get();

            // if ip address changes, it logs out
            if (!session.getIpAddress().equals(oldSession.getIpAddress())) {
                sessionRepository.delete(oldSession);
                return;
            } else {
                sessionRepository.delete(oldSession);
            }
        }
        // saves new session if same user makes a request
        sessionRepository.save(session);
    }

    public void saveSession(String token, String ipAddress, User user) {
        if (user != null && !token.isBlank()) {
            Session session = new Session();
            session.setIpAddress(ipAddress);
            session.setToken(token);
            session.setUser(user);

            saveSession(session);
        }
    }

    public Optional<Session> getSessionByUser(User user) {
        return Optional.ofNullable(sessionRepository.findByUser(user));
    }

    public void deleteById(String token) {
        sessionRepository.deleteById(token);
    }

    public void deleteByUsername(User user) {
        Optional<Session> sessionOptional = getSessionByUser(user);

        if (sessionOptional.isPresent()) {
            sessionRepository.delete(sessionOptional.get());
        }
    }

    public Session getSessionByToken(String token) {
        Optional<Session> sessionOptional = sessionRepository.findById(token);
        if (sessionOptional.isPresent())
            return sessionOptional.get();
        return null;
    }

    public Optional<Session> getSessionByUsername(String username) {
        Optional<User> userOptional = userService.getUserByUsername(username);
        if (userOptional.isPresent())
            return getSessionByUser(userOptional.get());
        return null;
    }
}
