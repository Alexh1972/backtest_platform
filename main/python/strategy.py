import json
from redisClient import redis_conn
from executorService import executor

pubsub = redis_conn.pubsub()
pubsub.subscribe("strategy-run-request-topic")

def run_strategy(file, start, end, tickers):
    print(file, start, end, tickers)
    try:
        module = __import__(file)
        class_ = getattr(module, "Strategy")
        instance = class_()
        print(instance.onCandle({"Open": 0.0, "Close": 1.0}, "NVDA"))
    except Exception as e:
        json_str = json.dumps({"Error": str(e)})
        print(json_str)

def process_message(message):
    try:
        if message["type"] == "message":
            json_str = message["data"]
            obj = json.loads(json_str)
            run_strategy(**obj)
    except Exception as e:
        print(f"Error processing message: {e}")

def run():
    for message in pubsub.listen():
        print(message)
        executor.submit(process_message, message)

