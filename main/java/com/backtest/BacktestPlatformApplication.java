package com.backtest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BacktestPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(BacktestPlatformApplication.class, args);
	}

}
