import oracledb

user = "c##backtest"
password = "Backtest"
dsn = "localhost:1521/orcl"

connection = oracledb.connect(
    user=user,
    password=password,
    dsn=dsn
)