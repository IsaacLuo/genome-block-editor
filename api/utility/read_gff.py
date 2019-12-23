import sys
import re
import json
import os.path
import urllib
from fasta_db import FastaDB

def rc(seq):
    d = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'}
    return ''.join([d[x] for x in list(seq[::-1])])

class GFFReader:
    def __init__(self, gff_file_name, fasta_file_name = None):
        if not fasta_file_name:
            # try to find fasta in gff file
            fasta_file_name = os.path.splitext(gff_file_name)[0] + '.fa'
            fpw = None
            with open(gff_file_name) as fp:
                for line in fp:
                    if re.match('##FASTA', line):
                        fpw = open(fasta_file_name, 'w')
                        continue
                    if fpw:
                        fpw.write(line)
            if fpw == None:
                raise Exception('can not find fasta')
        
        self.gff_file_name = gff_file_name
        self.fasta_file_name = fasta_file_name
        self.fasta_db = FastaDB()
        self.fasta_db.set_file(fasta_file_name)

    def get_fasta_db(self):
        return self.fasta_db

    def read_gff(self):
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
                if end - start > 15728640: # 15MB
                    sequence = None
                else:
                    sequence = self.fasta_db.find(seq_name, start, end)
                    if strand == '-':
                        sequence = rc(sequence)

                record = {
                    'seqName': segment[0],
                    'source': segment[1],
                    'feature': segment[2],
                    'start': int(segment[3])-1,
                    'end': int(segment[4]),
                    'score': segment[5],
                    'strand': segment[6],
                    'frame': segment[7],
                    'attribute': attributes,
                    'sequence': sequence,
                    }
                yield record