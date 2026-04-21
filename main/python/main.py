import stock
import strategy
from executorService import executor
import sys
sys.path.insert(1, '../../../storage/scripts')

executor.submit(strategy.run)
stock.run()