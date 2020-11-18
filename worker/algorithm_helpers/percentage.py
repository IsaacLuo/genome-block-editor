import time

class PercentageCounter:
    def __init__(self):
        self.start = 0
        self.end = 100
        self.count_item_length = 100
        self.last_percentage = -1
        self.last_time_stamp = time.time()
        
    def set_count_range(self, start, end, count_item_length):
        self.start = start
        self.end = end
        self.count_item_length = count_item_length
        self.last_percentage = start - 1
        self.last_time_stamp = time.time()
    
    def build_message_by_count(self, count, message, data=None, **kwargs):
        percentage = (self.end - self.start) * count // self.count_item_length + self.start
        time_stamp = time.time()
        if 'ctype' not in kwargs:
            kwargs['ctype'] = 'progress'
        if percentage > self.last_percentage or \
                time_stamp >= self.last_time_stamp + 1 or \
                'force' in kwargs and kwargs['force']:
            self.last_percentage = percentage
            self.last_time_stamp = time_stamp
            return {'ctype': kwargs['ctype'], 'percentage': percentage, 'message': message, 'data': data}
        else:
            return None
        
    def build_message(self, percentage, message, data=None, **kwargs):
        if 'ctype' not in kwargs:
            kwargs['ctype'] = 'progress'
        return {'ctype': kwargs['ctype'], 'percentage': percentage, 'message': message, 'data': data}

    def build_result(self, percentage, message, data=None, **kwargs):
        if 'ctype' not in kwargs:
            kwargs['ctype'] = 'result'
        return {'ctype': kwargs['ctype'], 'percentage': percentage, 'message': message, 'data': data}
        