import io
import json
import sys
import tarfile

from django.db import connection

from redisClient import redis_conn
from executorService import executor
from datetime import datetime
from datetime import timezone
from database import connection
import os
import docker
import platform

from simulation import Simulation, TradingContext

if platform.system() == "Windows":
    dockerClient = docker.DockerClient(base_url='npipe:////./pipe/docker_engine')
else:
    dockerClient = docker.DockerClient(base_url='unix://var/run/docker.sock')

pubsub = redis_conn.pubsub()
pubsub.subscribe("strategy-run-request-topic")


BASE_DIR = "../../../storage/"
STOCK_ROWS_DIR = BASE_DIR + "stock_rows/"

def datetime_handler(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

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

def copy_from_container(container, src_path, dest_folder):
    try:
        bits, stat = container.get_archive(src_path)
        with io.BytesIO() as buffer:
            for chunk in bits:
                buffer.write(chunk)
            buffer.seek(0)
            with tarfile.open(fileobj=buffer) as tar:
                tar.extractall(path=dest_folder)
    except Exception as e:
        print(f"Could not find or copy {src_path}: {e}")

def run_strategy_docker(file, start, end, tickers, capital, id):
    start_str = start
    end_str = end
    try:
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
            rows = [dict(zip(column_names, row)) for row in cursor]

            stock_file_path = STOCK_ROWS_DIR + file + '-' + str(id) + ".json"
            with open(stock_file_path, "w") as f:
                json.dump(rows, f, default=datetime_handler)

            with connection.cursor() as cursor:
                sql = ("SELECT * "
                       "FROM stock "
                       "where "
                       "ticker = 'SPY' AND "
                       "interval_date between :1 and :2"
                       "ORDER BY interval_date")
                cursor.execute(sql, [start, end])

                benchmark_file_path = STOCK_ROWS_DIR + file + '-' + str(id) + "-benchmark.json"
                rows = [dict(zip(column_names, row)) for row in cursor]
                with open(benchmark_file_path, "w") as f:
                    json.dump(rows, f, default=datetime_handler)

            try:
                current_code_path = os.path.abspath(os.getcwd())
                host_storage_path = os.path.abspath(os.path.join(current_code_path, BASE_DIR))
                module_path = os.path.join(host_storage_path, "scripts", file + '.py')

                volumes = {
                    os.path.abspath(module_path): {
                        'bind': '/app/storage/scripts/strategy_module.py',
                        'mode': 'ro'
                    },
                    current_code_path: {
                        'bind': '/app',
                        'mode': 'ro'
                    },
                    os.path.abspath(stock_file_path): {
                        'bind': '/tmp/stock_rows.json',
                        'mode': 'ro'
                    },
                    os.path.abspath(benchmark_file_path): {
                        'bind': '/tmp/benchmark_rows.json',
                        'mode': 'ro'
                    },
                }

                command_args = [
                    "python3", "simulation_worker.py",
                    "--file", str(file),
                    "--start", start_str,
                    "--end", end_str,
                    "--tickers", ",".join(tickers),
                    "--capital", str(capital),
                    "--id", str(id)
                ]

                container = dockerClient.containers.run(
                    image="sim_engine:latest",
                    command=command_args,
                    working_dir="/app",
                    volumes=volumes,
                    detach=True
                )
                container.wait()

                graph_src = f"/tmp/sim_results/equity_graphs/{file}-{id}.png"
                trade_src = f"/tmp/sim_results/trades/{file}-{id}.csv"

                host_base = os.path.abspath(BASE_DIR)
                try:
                    copy_from_container(container, graph_src, os.path.join(host_base, "equity_graphs"))
                    copy_from_container(container, trade_src, os.path.join(host_base, "trades"))
                finally:
                    payload = container.logs().decode('utf-8')
                    container.remove(force=True)
                redis_conn.publish("strategy-run-response-topic", payload)
            finally:
                if os.path.exists(stock_file_path):
                    os.remove(stock_file_path)
                if os.path.exists(benchmark_file_path):
                    os.remove(benchmark_file_path)
    except Exception as e:
        print(e)
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
            run_strategy_docker(**obj)
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

