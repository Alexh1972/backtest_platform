import json
import sys

from django.db import connection

from redisClient import redis_conn
from executorService import executor
from datetime import datetime
from datetime import timezone
from database import connection

from simulation import Simulation, TradingContext

pubsub = redis_conn.pubsub()
pubsub.subscribe("strategy-run-request-topic")

def run_strategy(file, start, end, tickers, capital, id):
    start_str = start
    end_str = end
    try:
        module = __import__(file)
        class_ = getattr(module, "Strategy")

        trading_context = TradingContext(capital)
        instance = class_(trading_context)

        with connection.cursor() as cursor:
            obj_type = connection.gettype("SYS.ODCIVARCHAR2LIST")

            start = datetime.fromisoformat(start).astimezone(timezone.utc).replace(tzinfo=None)
            end = datetime.fromisoformat(end).astimezone(timezone.utc).replace(tzinfo=None)

            tickers_collection = obj_type.newobject(tickers)
            sql = ("SELECT * "
                   "FROM stock "
                   "where "
                   "ticker in (SELECT column_value FROM TABLE(:1)) AND "
                   "interval_date between :2 and :3"
                   "ORDER BY interval_date")
            cursor.execute(sql, [tickers_collection, start, end])

            column_names = [d[0] for d in cursor.description]
            simulation = Simulation(instance, trading_context, file, start, end, id)
            for row in cursor:
                row = dict(zip(column_names, row))
                simulation.update(row)

            simulation.end()
            report = simulation.get_report()

            if file in sys.modules:
                del sys.modules[file]

            report_data = {
                "id": id,
                "tickers": ":".join(sorted(tickers)),
                "startDate": start_str,
                "endDate": end_str,
                "fileHash": file,
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

            redis_conn.publish("strategy-run-response-topic", json.dumps(report_data))
    except Exception as e:
        error_payload = {
            "id": id,
            "tickers": ":".join(sorted(tickers)),
            "startDate": start_str,
            "endDate": end_str,
            "fileHash": file,
            "error": str(e),
            "success": False
        }
        redis_conn.publish("strategy-run-response-topic", json.dumps(error_payload))

def process_message(message):
    try:
        if message["type"] == "message":
            json_str = message["data"]
            obj = json.loads(json_str)
            run_strategy(**obj)
    except Exception as e:
        print(f"Error processing message: {e}")

def run():
    try:
        for message in pubsub.listen():
            print(message)
            executor.submit(process_message, message)
    finally:
        if 'connection' in locals() and connection:
            connection.close()

