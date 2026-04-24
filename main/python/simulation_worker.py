import argparse
import os
import json
import sys
from datetime import datetime, timezone
import re

from simulation import TradingContext, Simulation

sys.path.insert(1, 'storage/scripts')

BASE_DIR = "storage/"
STOCK_ROWS_DIR = BASE_DIR + "stock_rows/"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=str)
    parser.add_argument("--start", type=str)
    parser.add_argument("--end", type=str)
    parser.add_argument("--tickers", type=str)
    parser.add_argument("--capital", type=float)
    parser.add_argument("--id", type=int)

    args = parser.parse_args()

    start = datetime.fromisoformat(re.sub(r"(\.\d{6})\d+", r"\1", args.start)).astimezone(timezone.utc).replace(tzinfo=None)
    end = datetime.fromisoformat(re.sub(r"(\.\d{6})\d+", r"\1", args.end)).astimezone(timezone.utc).replace(tzinfo=None)

    tickers = args.tickers.split(",")

    data_path = STOCK_ROWS_DIR + args.file + "-" + str(args.id) + ".json"
    with open(data_path, 'r') as f:
        rows = json.load(f)

    data_path = STOCK_ROWS_DIR + args.file + "-" + str(args.id) + "-benchmark.json"
    with open(data_path, 'r') as f:
        benchmark_rows = json.load(f)

    module = __import__(args.file)
    class_ = getattr(module, "Strategy")
    trading_context = TradingContext(args.capital)
    instance = class_(trading_context)
    simulation = Simulation(instance, trading_context, args.file, start, end, args.id, benchmark_rows)
    rows = [{**row, 'INTERVAL_DATE': datetime.fromisoformat(re.sub(r"(\.\d{6})\d+", r"\1", row['INTERVAL_DATE'])).astimezone(timezone.utc).replace(tzinfo=None)} for row in rows]

    for row in rows:
        simulation.update(row)

    simulation.end()
    report = simulation.get_report()

    if args.file in sys.modules:
        del sys.modules[args.file]

    start_str = args.start
    end_str = args.end
    report_data = {
        "id": args.id,
        "tickers": ":".join(sorted(tickers)),
        "startDate": start_str,
        "endDate": end_str,
        "fileHash": args.file,
        "fullReturn": report.full_return,
        "annualizedReturn": report.annualized_return,
        "dailyReturn": report.daily_return,
        "annualRisk": report.annual_risk,
        "dailyRisk": report.daily_risk,
        "sharpeRatio": report.sharpe_ratio,
        "sortinoRatio": report.sortino_ratio,
        "maxDrawdown": report.max_drawdown,
        "calmarRatio": report.calmar_ratio,
        "beta": report.beta,
        "alpha": report.alpha,
        "var95": report.var_95,
        "skewness": report.skewness,
        "kurtosis": report.kurtosis,
        "success": True
    }

    print(json.dumps(report_data))




if __name__ == "__main__":
    main()