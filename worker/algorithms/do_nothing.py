from algorithm_helpers.percentage import PercentageCounter
import time


def do_nothing(**kwargs):
    percentage_counter = PercentageCounter()
    for count in range(0,101,10):
        time.sleep(1)
        yield percentage_counter.build_result(count, 'doing {}%'.format(count))
        
