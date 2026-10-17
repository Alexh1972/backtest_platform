# Backtest Platform

A distributed platform for backtesting algorithmic trading strategies. Users submit Python trading strategies through a REST API, and the platform executes them against historical market data in isolated Docker containers, returning a full suite of performance and risk metrics benchmarked against the S&P 500.

## Architecture

The system is split into two services communicating over Redis pub/sub:

```
┌──────────┐  REST + JWT   ┌──────────────────┐
│  Client  │ ────────────► │ Spring Boot API  │
└──────────┘               │    (Java 17)     │
                           └────────┬─────────┘
                                    │ Redis pub/sub
                                    ▼
                           ┌──────────────────┐   spawns    ┌──────────────────┐
                           │  Python Worker   │ ──────────► │ Docker container │
                           └────────┬─────────┘             │   (sim_engine)   │
                                    │                        └──────────────────┘
                            ┌───────┴───────┐
                            ▼               ▼
                       ┌─────────┐     ┌──────────┐
                       │ Oracle  │     │  Redis   │
                       └─────────┘     └──────────┘
```

- **Spring Boot API** — Handles JWT authentication, strategy submission, and backtest requests. Publishes jobs to Redis and persists results to Oracle.
- **Python worker** — Fetches historical data via `yfinance` and runs user strategies inside disposable Docker containers for isolation from untrusted code.
- **Oracle Database** — Stores users, stock candles, submissions, and backtest reports.
- **Redis** — Message bus between the Java and Python services.

## How it works

1. The user authenticates and submits a Python strategy, which the API stores and records as a submission.
2. The user starts a run; the API creates a report and publishes the job to Redis.
3. The worker pulls the relevant stock rows and an SPY benchmark from Oracle, then runs the strategy in a sandboxed Docker container.
4. The simulation computes metrics, renders an equity curve, and writes a trades log. Results are published back to the API, which marks the report complete.
5. A scheduler refreshes market data hourly for a fixed universe of tickers.

## Metrics

Each backtest produces full/annualized/daily return, annual and daily risk, Sharpe, Sortino, Calmar ratios, max drawdown, beta, alpha, 95% VaR, skewness, and kurtosis — all benchmarked against SPY.

## Tech stack

- **Backend:** Java 17, Spring Boot, Spring Security (JWT), Spring Data JPA, AOP, Lombok
- **Worker:** Python, yfinance, pandas, NumPy, SciPy, matplotlib, Docker SDK, oracledb
- **Infrastructure:** Oracle Database, Redis, Docker
