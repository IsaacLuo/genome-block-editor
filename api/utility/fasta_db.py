class FastaDB:
    file_obj = None
    cached_seq_name = None
    cached_seq = None
    seq_index = {}

    def set_file(self, file_name):
        self.file_obj = open(file_name)
        self.cache_seq_name = None
        self.cache_seq = None
        self.build_index()


    def build_index(self):
        self.check_file_object()
        self.file_obj.seek(0)
        it = 0
        seq_name = ''
        for line in self.file_obj:
            if line[0] == '>':
                seq_name = line[1:-1].strip()
            elif seq_name not in self.seq_index:
                self.seq_index[seq_name] = it
                print(seq_name, it)
            it += len(line)

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
                line = self.file_obj.readline()
                if line[0] == '>' or not line:
                    break
                else:
                    seq.append(line.strip())
                    # print('c=', c)
                    # c+=len(line)
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
