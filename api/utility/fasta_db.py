class FastaDB:
    def __init__(self):
        self.file_obj = None
        self.cached_seq_name = None
        self.cached_seq = None
        self.seq_index = {}
        self.seq_lens_dict = {}

    def set_file(self, file_name):
        self.file_obj = open(file_name, 'rb')
        self.cache_seq_name = None
        self.cache_seq = None
        self.build_index()


    def build_index(self):
        self.check_file_object()
        self.file_obj.seek(0)
        it = 0
        seq_name = ''
        for line_raw in self.file_obj:
            line = line_raw.decode('utf-8').strip()
            if line[0] == '>':
                seq_name = line[1:]
            elif seq_name not in self.seq_index:
                self.seq_index[seq_name] = it
                print(seq_name, it)
            it += len(line_raw)

    def check_file_object(self):
        if self.file_obj == None:
            raise Exception('no file object')
    
    def get_seq(self, seq_name):
        self.check_file_object()
        if self.cached_seq_name == seq_name:
            return self.cache_seq
        if seq_name in self.seq_index:
            self.file_obj.seek(self.seq_index[seq_name])
            seq = []
            print('caching ', seq_name)
            # c = 0
            while True:
                line_raw = self.file_obj.readline()
                if not line_raw:
                    break
                line = line_raw.decode('utf-8').strip()
                if line[0] == '>':
                    break
                else:
                    seq.append(line)
            self.cached_seq_name = seq_name
            self.cache_seq = ''.join(seq)
            return self.cache_seq
        else:
            raise Exception('could not find seq')

    def find(self, seq_name, start=None, end=None):
        seq = self.get_seq(seq_name)
        if start == None and end == None:
            return seq
        else:
            if start == None:
                start = 0
            if end == None:
                end = len(seq)
            return seq[start:end]

    def get_seq_len(self, seq_name):
        if seq_name not in self.seq_lens_dict:
            self.seq_lens_dict[seq_name] = len(self.get_seq(seq_name))
        return self.seq_lens_dict[seq_name]