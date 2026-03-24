import stock
import strategy
from executorService import executor
import sys
sys.path.insert(1, '../../../scripts')

executor.submit(strategy.run);
stock.run()