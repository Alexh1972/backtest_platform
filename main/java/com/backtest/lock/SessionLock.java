package com.backtest.lock;

import com.backtest.model.Session;
import com.backtest.service.SessionService;
import com.backtest.util.SemaphoreUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.ConcurrentReferenceHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.Semaphore;

@Service
@Slf4j
@RequiredArgsConstructor
public class SessionLock {
	private ConcurrentReferenceHashMap<String, SemaphoreUtil> semaphoreMap = new ConcurrentReferenceHashMap<>();
	private final SessionService sessionService;

	public boolean lock(Session session) {
		return lock(session.getUser().getUsername());
	}

	public boolean lock(String key) {
		SemaphoreUtil semaphoreUtil = semaphoreMap.compute(key, (k, v) -> v == null ? new SemaphoreUtil(new Semaphore(1), System.currentTimeMillis(), key) : v);
		try {
			semaphoreUtil.getSemaphore().acquire();
			semaphoreUtil.setTime(System.currentTimeMillis());
			log.info("Locked Session - User {}", key);
			return true;
		} catch (Exception e) {
			log.error("Lock Session - User {}", key, e);
			return false;
		}
	}

	public void unlock(Session session) {
		unlock(session.getUser().getUsername());
	}

	public void unlock(String key) {
		try {
			SemaphoreUtil semaphoreUtil = semaphoreMap.get(key);
			if (semaphoreUtil.getTime() > 0) {
				log.info("Unlocked Session - User {}", key);

				semaphoreUtil.setTime(0L);
				semaphoreUtil.getSemaphore().release();
			}
		} catch (Exception e) {
			log.error("Unlock Session - User {}", key, e);
		}
	}

	@Scheduled(fixedDelay = 1000*30)
	private void checkTimeout() {
		for (SemaphoreUtil semaphoreUtil : semaphoreMap.values()) {
			if (semaphoreUtil.getTime() + 10*60*1000 < System.currentTimeMillis() && semaphoreUtil.getTime() > 0) {
				String username = semaphoreUtil.getKey();
				Optional<Session> sessionOptional = sessionService.getSessionByUsername(username);
                sessionOptional.ifPresent(this::unlock);

				if (sessionOptional.isEmpty()) {
					semaphoreMap.remove(username);
				}
			}
		}
	}
}
