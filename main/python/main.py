import redis
import yfinance as yf

redis_conn = redis.Redis(
    host='localhost',
    port=6379)

ticker_symbol = "AAPL"
ticker = yf.Ticker(ticker_symbol)
historical_data = ticker.history(period="30d", interval="15m")
historical_data['Date'] = historical_data.index
historical_data['Date'] = historical_data['Date'].map(lambda x: str(x))

redis_conn.publish("stock-topic", historical_data.to_json(orient='records'))