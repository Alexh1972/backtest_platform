import math
from datetime import datetime, timezone

import matplotlib
import statistics
import numpy as np
from scipy.stats import skew, kurtosis
import re

matplotlib.use('Agg')
import matplotlib.pyplot as plt
import csv

BASE_DIR = "storage/"
EQUITY_GRAPH_DIR = BASE_DIR + "equity_graphs/"
TRADES_DIR = BASE_DIR + "trades/"

class Trade:
    def __init__(self, price, quantity, date):
        self.price = price
        self.quantity = quantity
        self.date = date

    def __str__(self):
        side = "BUY" if self.quantity > 0 else "SELL"
        color = "🟢" if side == "BUY" else "🔴"

        label_w = 12
        val_w = 25
        delim = "—" * 40

        return (
            f"{delim}\n"
            f"{side:<10} | {self.date}\n"
            f"{'-' * 40}\n"
            f"{'Price:':<{label_w}} {self.price:>{val_w}.2f}\n"
            f"{'Quantity:':<{label_w}} {self.quantity:>{val_w}.8f}\n"
            f"{'Total:':<{label_w}} {(self.price * self.quantity):>{val_w}.2f}\n"
            f"{delim}"
        )

    def to_csv_row(self):
        side = "BUY" if self.quantity > 0 else "SELL"
        return [str(self.date), side, str(self.price), str(self.quantity), str(self.price * self.quantity)]

class TradingContext:
    def __init__(self, capital):
        self.capital = capital
        self.stock_quantities = {}
        self.last_candles = {}
        self.trades = []
        self.total_equity = {}
        self.initial_capital = capital
        self.sorted_dates = []
        self.equity_values = []
        self.daily_sorted_dates = []
        self.daily_equity_values = []
        self.daily_equity = {}
        self.benchmark_sorted_dates = []
        self.benchmark_values = []
        self.benchmark = {}
        self.benchmark_daily_sorted_dates = []
        self.benchmark_daily_values = []
        self.benchmark_daily = {}

    def get_assets(self):
        assets_value = 0
        for ticker, qty in self.stock_quantities.items():
            if ticker in self.last_candles:
                assets_value += qty * self.last_candles[ticker]['CLOSE']
        return assets_value

    def get_equity(self):
        return self.capital + self.get_assets()

    def __str__(self):
        assets_value = self.get_assets()
        total_value = self.get_equity()

        label_w = 15
        val_w = 22
        delim = "═" * 40

        output = [
            delim,
            f"PORTFOLIO SUMMARY",
            "─" * 40,
            f"{'Available Cash:':<{label_w}} {self.capital:>{val_w}.2f}",
            f"{'Assets Value:':<{label_w}} {assets_value:>{val_w}.2f}",
            f"{'Total Equity:':<{label_w}} {total_value:>{val_w}.2f}",
            "─" * 40,
            f"{'Open Positions:':<{label_w}} {len(self.stock_quantities)}",
            f"{'Total Trades:':<{label_w}} {len(self.trades)}",
            delim
        ]

        return "\n".join(output)


def get_sharpe_ratio(ret, risk):
    return ret / risk


class Simulation:
    def __init__(self, instance, trading_context, file, start, end, id_strategy, benchmark_rows):
        self.__instance = instance
        self.__trading_context = trading_context
        self.__file = file
        self.__id = id_strategy
        self.__start = start
        self.__end = end
        self.__benchmark_rows = [
            {
                **row,
                'INTERVAL_DATE': datetime.fromisoformat(
                    re.sub(r"(\.\d{6})\d+", r"\1", row['INTERVAL_DATE'])).astimezone(timezone.utc).replace(tzinfo=None)
            }
            for row in benchmark_rows
        ]

    def update(self, candle):
        ticker = candle['TICKER']
        self.__trading_context.last_candles[ticker] = candle

        quantity = math.floor(self.__instance.onCandle(candle))

        if quantity == 0:
            self.__trading_context.total_equity[candle['INTERVAL_DATE']] = self.__trading_context.get_equity()
            return

        trade_price = quantity * candle['CLOSE']

        if trade_price > self.__trading_context.capital:
            quantity = math.floor(self.__trading_context.capital / candle['CLOSE'])

            if quantity <= 0:
                self.__trading_context.total_equity[candle['INTERVAL_DATE']] = self.__trading_context.get_equity()
                return
            trade_price = quantity * candle['CLOSE']

        current_quantity = self.__trading_context.stock_quantities.get(ticker, 0)
        current_quantity += quantity

        self.__trading_context.capital -= trade_price
        self.__trading_context.stock_quantities[ticker] = current_quantity
        self.__trading_context.trades.append(Trade(candle['CLOSE'], quantity, candle['INTERVAL_DATE']))

        self.__trading_context.total_equity[candle['INTERVAL_DATE']] = self.__trading_context.get_equity()

    def end(self):
        for stock in self.__trading_context.stock_quantities:
            quantity = self.__trading_context.stock_quantities[stock]
            if quantity != 0:
                candle = self.__trading_context.last_candles[stock]
                last_price = candle['CLOSE']
                trade_price = quantity * last_price

                self.__trading_context.capital += trade_price
                self.__trading_context.trades.append(Trade(candle['CLOSE'], -quantity, candle['INTERVAL_DATE']))
        self.__trading_context.sorted_dates = sorted(self.__trading_context.total_equity.keys())
        self.__trading_context.equity_values = [self.__trading_context.total_equity[date] for date in self.__trading_context.sorted_dates]

        for date in self.__trading_context.sorted_dates:
            day = date.date()
            self.__trading_context.daily_equity[day] = self.__trading_context.total_equity[date]
        self.__trading_context.daily_sorted_dates = sorted(self.__trading_context.daily_equity.keys())

        for date in self.__trading_context.daily_sorted_dates:
            self.__trading_context.daily_equity_values.append(self.__trading_context.daily_equity[date])

        self.get_benchmark()

    def get_benchmark(self):
        scaling_price = None
        for row in self.__benchmark_rows:
            if scaling_price is None:
                scaling_price = row['CLOSE']

            self.__trading_context.benchmark[row['INTERVAL_DATE']] = self.__trading_context.initial_capital * row['CLOSE'] / scaling_price

        self.__trading_context.benchmark_sorted_dates = sorted(self.__trading_context.benchmark.keys())
        self.__trading_context.benchmark_values = [self.__trading_context.benchmark.get(d) for d in self.__trading_context.benchmark_sorted_dates]

        for date in self.__trading_context.benchmark_sorted_dates:
            day = date.date()
            self.__trading_context.benchmark_daily[day] = self.__trading_context.benchmark[date]

        self.__trading_context.benchmark_daily_sorted_dates = sorted(self.__trading_context.benchmark_daily.keys())
        for date in self.__trading_context.benchmark_daily_sorted_dates:
            self.__trading_context.benchmark_daily_values.append(self.__trading_context.benchmark_daily[date])

    def __plot_benchmark(self, ax):
        sorted_dates = self.__trading_context.benchmark_sorted_dates
        price_values = self.__trading_context.benchmark_values
        ax.plot(sorted_dates, price_values, color='#3498db', linewidth=1.5, label='Benchmark')

        return self.__trading_context.get_equity() > price_values[-1]

    def plot_equity_curve(self):
        equity_dict = self.__trading_context.total_equity
        if not equity_dict:
            print("Dictionary is empty. Nothing to plot.")
            return

        fig, ax = plt.subplots(figsize=(12, 6))

        sorted_dates = self.__trading_context.sorted_dates
        values = self.__trading_context.equity_values

        outperformed = self.__plot_benchmark(ax)
        color = '#2ecc71'
        if not outperformed:
            color = '#e74c3c'

        ax.plot(sorted_dates, values, color=color, linewidth=2, label='Equity Curve')
        ax.fill_between(sorted_dates, values, color=color, alpha=0.2)

        ax.legend(loc='best', fontsize=10)
        ax.set_title("Portfolio Equity Curve", fontsize=14)
        ax.set_xlabel("Interval Date")
        ax.set_ylabel("Total Equity ($)")
        ax.grid(True, linestyle='--', alpha=0.6)

        plt.setp(ax.get_xticklabels(), rotation=45)
        fig.tight_layout()

        fig.savefig(EQUITY_GRAPH_DIR + self.__file + '-' + str(self.__id) + '.png')

        fig.clf()
        plt.close(fig)

    def process_trades(self):
        header = ['Date', 'Side', 'Price', 'Quantity', 'Total_Value']
        filename = TRADES_DIR + self.__file + '-' + str(self.__id) + '.csv'

        with open(filename, 'w', newline='') as f:
            writer = csv.writer(f)

            writer.writerow(header)

            for trade in self.__trading_context.trades:
                writer.writerow(trade.to_csv_row())

    def get_return(self):
        sorted_dates = self.__trading_context.sorted_dates
        full_return = self.__trading_context.total_equity[sorted_dates[-1]] / self.__trading_context.initial_capital - 1

        daily_return = (full_return + 1) ** (1 / (self.__end - self.__start).days) - 1
        annualized_return = (1 + daily_return) ** 252 - 1

        return daily_return, annualized_return, full_return

    def get_risk(self):
        sorted_dates = self.__trading_context.daily_sorted_dates
        returns = []
        last_equity = None
        last_date = None

        for date in sorted_dates:
            equity = self.__trading_context.daily_equity[date]

            if last_equity is not None:
                returns.append((equity / last_equity) ** (1 / (date - last_date).days) - 1)

            last_equity = equity
            last_date = date

        daily_risk = statistics.stdev(returns)
        annual_risk = daily_risk * (252 ** (1 / 2))
        return daily_risk, annual_risk

    def get_sortino_ratio(self, annual_return=0.07, target=0):
        sorted_dates = self.__trading_context.daily_sorted_dates

        returns = []
        last_date = None
        for date in sorted_dates:
            if last_date is not None:
                returns.append(min(self.__trading_context.daily_equity[date] / self.__trading_context.daily_equity[last_date] - 1 - target, 0))
            last_date = date

        std_dev = 0
        for ret in returns:
            std_dev += ret ** 2
        daily_std_dev = (std_dev / len(returns)) ** (1 / 2)
        annual_std_dev = daily_std_dev * (252 ** (1 / 2))
        return annual_return / annual_std_dev

    def get_max_drawdown(self):
        sorted_dates = self.__trading_context.daily_sorted_dates
        current_peak = None
        max_drawdown = None

        for date in sorted_dates:
            value = self.__trading_context.daily_equity[date]
            if current_peak is not None:
                drawdown = (current_peak - value) / current_peak

                if max_drawdown is None or max_drawdown < drawdown:
                    max_drawdown = drawdown

            if current_peak is None or current_peak < value:
                current_peak = value
        return max_drawdown

    def get_calmar_ratio(self, annual_return, max_drawdown):
        if max_drawdown is None or max_drawdown == 0:
            return float('inf')

        return annual_return / max_drawdown

    def get_beta(self):
        dates = sorted(self.__trading_context.benchmark_daily.keys() & self.__trading_context.daily_equity.keys())

        benchmark_vals = np.array([self.__trading_context.benchmark_daily[d] for d in dates])
        equity_vals = np.array([self.__trading_context.daily_equity[d] for d in dates])

        benchmark_returns = np.diff(benchmark_vals) / benchmark_vals[:-1]
        equity_returns = np.diff(equity_vals) / equity_vals[:-1]

        cov_matrix = np.cov(benchmark_returns, equity_returns, ddof=1)
        var_market = np.var(benchmark_returns, ddof=1)
        return cov_matrix[0, 1] / var_market

    def get_alpha(self, beta=1, risk_free=0.04):
        rp_total = self.__trading_context.daily_equity_values[-1] / self.__trading_context.daily_equity_values[0] - 1
        rm_total = self.__trading_context.benchmark_daily_values[-1] / self.__trading_context.benchmark_daily_values[0] - 1

        delta = self.__trading_context.daily_sorted_dates[-1] - self.__trading_context.daily_sorted_dates[0]
        years = delta.total_seconds() / (86400 * 365)

        rp_annual = (1 + rp_total) ** (1 / years) - 1
        rm_annual = (1 + rm_total) ** (1 / years) - 1

        return rp_annual - (risk_free + beta * (rm_annual - risk_free))

    def get_var(self, q=0.95):
        values = self.__trading_context.daily_equity_values

        returns = []
        for i in range(1, len(values)):
            prev = values[i - 1]
            curr = values[i]
            returns.append((curr - prev) / prev)

        var_threshold = np.percentile(returns, (1 - q) * 100)

        return var_threshold

    def get_skew_kurt(self):
        values = self.__trading_context.daily_equity_values

        returns = []
        for i in range(1, len(values)):
            prev = values[i - 1]
            curr = values[i]
            returns.append((curr - prev) / prev)

        return skew(returns), kurtosis(returns)

    def get_report(self):
        self.plot_equity_curve()
        self.process_trades()

        daily_return, annualized_return, full_return = self.get_return()
        daily_risk, annual_risk = self.get_risk()

        sharpe_ratio = get_sharpe_ratio(annualized_return, annual_risk)
        sortino_ratio = self.get_sortino_ratio(annualized_return)
        max_drawdown = self.get_max_drawdown()
        calmar_ratio = self.get_calmar_ratio(annualized_return, max_drawdown)

        beta = self.get_beta()
        alpha = self.get_alpha(beta=beta)

        var95 = self.get_var()
        skew, kurt = self.get_skew_kurt()

        report = BacktestReport(
            full_return=full_return,
            annualized_return=annualized_return,
            daily_return=daily_return,
            annual_risk=annual_risk,
            daily_risk=daily_risk,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            max_drawdown=max_drawdown,
            calmar_ratio=calmar_ratio,
            beta=beta,
            alpha=alpha,
            var_95=var95,
            skewness=skew,
            kurtosis=kurt
        )

        return report

class BacktestReport:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __repr__(self):
        attrs = vars(self)
        items = []
        for key, val in attrs.items():
            formatted_val = f"{val:.4f}" if isinstance(val, (int, float)) else str(val)
            items.append(f"{key}={formatted_val}")

        return f"<BacktestReport\n  " + "\n  ".join(items) + "\n>"