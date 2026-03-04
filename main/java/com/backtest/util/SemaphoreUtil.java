package com.backtest.util;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.concurrent.Semaphore;


@Data
@AllArgsConstructor
public class SemaphoreUtil {
	Semaphore semaphore;
	Long time;
	String key;
}
