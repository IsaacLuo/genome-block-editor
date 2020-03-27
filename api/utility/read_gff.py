import sys
import re
import json
import os.path
import urllib
from fasta_db import FastaDB
import uuid

def rc(seq):
    d = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'}
    return ''.join([d[x] for x in list(seq[::-1])])

class GFFReader:
    def __init__(self, gff_file_name, fasta_file_name = None, **kwargs):
        if not fasta_file_name:
            # try to find fasta in gff file
            fasta_file_name = os.path.splitext(gff_file_name)[0] + '.fa'
            with open(gff_file_name) as fp:
                while True:
                    line = fp.readline()
                    if not line:
                        break
                    if re.match('##FASTA', line):
                        self.file_dict = self.convert_sequence_file(fp, kwargs['sequence_dir'])
                        break
        
        else:
            with open(fasta_file_name) as fp:
                self.file_dict = self.convert_sequence_file(fp, kwargs['sequence_dir'])
                    
        self.gff_file_name = gff_file_name
        self.fasta_file_name = fasta_file_name
        self.used_chr = set()
        self.dst_folder = kwargs['sequence_dir']
        self.fasta_db = FastaDB()
        self.fasta_db.set_file(fasta_file_name)

    def convert_sequence_file(self, file_obj, dst_folder):
        seq_name = None
        seq = []

        file_dict = {}

        print('converting fasta')
        count = 0
        while True:
            line = file_obj.readline()
            if not line:
                if seq_name:
                    file_name = str(uuid.uuid4())
                    with open(os.path.join(dst_folder, file_name), 'w') as fpw:
                        for s in seq:
                            fpw.write(s)
                    file_dict[seq_name] = file_name
                    seq = []
                break
            if line[0] == '>':
                if seq_name:
                    file_name = str(uuid.uuid4())
                    with open(os.path.join(dst_folder, file_name), 'w') as fpw:
                        for s in seq:
                            fpw.write(s)
                    file_dict[seq_name] = file_name
                    seq = []
                seq_name = line[1:].strip()
                count+=1
                print('imported {} fasta records                          '.format(count), end='\r')
            else:
                seq.append(line.strip())
        
        print('\nimported done')
        
        return file_dict

    def get_fasta_db(self):
        return self.fasta_db

    def read_gff(self, readSequence=False):
        with open(self.gff_file_name) as fp:
            for line in fp:
                if re.match('##FASTA', line):
                    break
                elif line[0] == '#':
                    continue
                segment = re.split('\t', line)
                attributesString = re.split('\n|;', segment[8])
                attributes = {}
                for s in attributesString:
                    e = s.split('=')
                    if len(e) >= 2 :
                        attributes[e[0]] = urllib.parse.unquote(e[1])
                seq_name = segment[0]
                start = int(segment[3])-1
                end =  int(segment[4])
                strand = segment[6]

                self.used_chr.add(seq_name)
                record = {
                    'seqName': segment[0],
                    'source': segment[1],
                    'feature': segment[2],
                    'start': start,
                    'end': end,
                    'score': segment[5],
                    'strand': strand,
                    'frame': segment[7],
                    'attribute': attributes,
                    'chrFileName': self.file_dict[seq_name],
                    }

                if readSequence:
                    if end - start > 15728640: # 15MB
                        sequence = None
                
                    sequence = self.fasta_db.find(seq_name, start, end)
                    if strand == '-':
                        sequence = rc(sequence)
                    
                    record['sequence'] = sequence

                yield record

            for key in self.file_dict.keys():
                if key not in self.used_chr:
                    os.remove(os.path.join(self.dst_folder, self.file_dict[key]))