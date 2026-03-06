import redis
import yfinance as yf
from datetime import datetime
import json

redis_conn = redis.Redis(
    host='localhost',
    port=6379)

def get_historical_data(ticker, start=None, end=None, interval="1d"):
    if end is None:
        end = datetime.now()
    else:
        end = datetime.fromisoformat(end)

    if start is None:
        start = datetime(1900, 1, 1, 0, 0, 0)
    else:
        start = datetime.fromisoformat(start)

    print(ticker, start, end, interval)
    ticker = yf.Ticker(ticker)
    historical_data = ticker.history(interval=interval, start=start, end=end)
    historical_data['Date'] = historical_data.index
    historical_data['Date'] = historical_data['Date'].map(lambda x: str(x))

    json_obj = json.loads(historical_data.to_json(orient='records'))
    response_dict = {
        "data": json_obj,
        "symbol": ticker,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "interval": interval
    }
    redis_conn.publish("stock-response-topic", historical_data.to_json(orient='records'))

pubsub = redis_conn.pubsub()
pubsub.subscribe("stock-request-topic")

for message in pubsub.listen():
    print(message)
    if message["type"] == "message":
        json_str = message["data"]
        obj = json.loads(json_str)
        get_historical_data(**obj)