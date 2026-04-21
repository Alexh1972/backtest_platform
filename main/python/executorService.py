from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=20)
smallExecutor = ThreadPoolExecutor(max_workers=3)