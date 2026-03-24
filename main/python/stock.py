import yfinance as yf
from datetime import datetime
import json
from executorService import executor
from redisClient import redis_conn

def get_historical_data(ticker, start=None, end=None, interval="1d"):
    if end is None:
        end = datetime.now()
        end_str = end.isoformat()
    else:
        end_str = end
        end = datetime.fromisoformat(end)

    if start is None:
        start = datetime(1900, 1, 1, 0, 0, 0)
        start_str = start.isoformat()
    else:
        start_str = start
        start = datetime.fromisoformat(start)

    ticker_yf = yf.Ticker(ticker)
    historical_data = ticker_yf.history(interval=interval, start=start, end=end)
    historical_data['Date'] = historical_data.index
    historical_data['Date'] = historical_data['Date'].map(lambda x: str(x))

    json_obj = json.loads(historical_data.to_json(orient='records'))
    response_dict = {
        "data": json_obj,
        "ticker": ticker,
        "start": start_str,
        "end": end_str,
        "interval": interval
    }

    redis_conn.publish("stock-response-topic", json.dumps(response_dict))

pubsub = redis_conn.pubsub()
pubsub.subscribe("stock-request-topic")

def process_message(message):
    try:
        if message["type"] == "message":
            json_str = message["data"]
            obj = json.loads(json_str)
            get_historical_data(**obj)
    except Exception as e:
        print(f"Error processing message: {e}")

def run():
    for message in pubsub.listen():
        print(message)
        executor.submit(process_message, message)