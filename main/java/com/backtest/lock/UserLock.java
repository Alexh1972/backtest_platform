package com.backtest.lock;

import com.backtest.model.User;
import com.backtest.service.UserService;
import com.backtest.util.ReentrantLockUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.ConcurrentReferenceHashMap;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserLock {
    private ConcurrentReferenceHashMap<String, ReentrantLockUtil> reentrantLockMap = new ConcurrentReferenceHashMap<>();

    private final UserService userService;

    public boolean lock(User user) {
        String key = String.valueOf(user.getUserId());
        ReentrantLockUtil reentrantLockUtil = reentrantLockMap.compute(key, (k, v) -> v == null ? new ReentrantLockUtil(new ReentrantLock(),  System.currentTimeMillis(), key) : v);
        try {
            reentrantLockUtil.getReentrantLock().lock();

            log.info("Locked User {}", key);
            return true;
        } catch (Exception e) {
            log.error("Lock User {}", key, e);
            return false;
        }
    }

    public void unlock(User user) {
        String key = String.valueOf(user.getUserId());
        try {
            ReentrantLockUtil reentrantLockUtil = reentrantLockMap.get(key);
            if (reentrantLockUtil.getTime() > 0
                    && reentrantLockUtil.getReentrantLock().isHeldByCurrentThread()) {
                log.info("Unlocked User {}", key);

                reentrantLockUtil.setTime(0L);
                reentrantLockUtil.getReentrantLock().unlock();
            }
        } catch (Exception e) {
            log.error("Unlock User - User {}", key, e);
        }
    }

    @Scheduled(fixedDelay = 1000*30)
    private void checkTimeout() {
        for (ReentrantLockUtil reentrantLockUtil : reentrantLockMap.values()) {
            if (reentrantLockUtil.getTime() + 10*60*1000 < System.currentTimeMillis() && reentrantLockUtil.getTime() > 0) {
                String key = reentrantLockUtil.getKey();
                Optional<User> user = userService.getUserById(Long.valueOf(key));
                user.ifPresent(this::unlock);

                if (user.isEmpty()) {
                    reentrantLockMap.remove(key);
                }
            }
        }
    }
}
