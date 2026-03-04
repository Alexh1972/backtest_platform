package com.backtest.util;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.concurrent.locks.ReentrantLock;

@Data
@AllArgsConstructor
public class ReentrantLockUtil {
    ReentrantLock reentrantLock;
    Long time;
    String key;
}
