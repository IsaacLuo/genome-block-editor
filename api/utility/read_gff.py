import sys
import re
import json
import os.path
import urllib

def read_external_fasta(file_name):
    fasta = {}
    with open(file_name) as fp:
        lines = fp.read().splitlines()
        current_fasta = ''
        for line in lines:
            if line[0] == '>':
                current_fasta = line[1:]
            elif len(line) > 5:
                fasta[current_fasta] = line
    return fasta

def read_gff(gff_file_name, fasta_file_name = None):
    fasta = {}
    if fasta_file_name:
        fasta = read_external_fasta(fasta_file_name)
        external_fasta = True
    else:
        external_fasta = False

    f = open(gff_file_name)
    fastaSection = False
    records = []
    contigs = []
    
    currentFasta = ''
    sequence = ''
    for line in f.readlines():
        if not external_fasta and re.match('##FASTA', line):
            fastaSection = True
        if line[0] == '#':
            continue
        if not fastaSection:
            segment = re.split('\t', line)
            attributesString = re.split('\n|;', segment[8])
            attributes = {}
            for s in attributesString:
                e = s.split('=')
                if len(e) >= 2 :
                    attributes[e[0]] = urllib.parse.unquote(e[1])
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
                }
            if record['feature'] == 'contig':
                contigs.append(record)
            else:
                records.append(record)
        else:
            if re.match(r'^>', line):
                print(line)
                if currentFasta != '':
                    fasta[currentFasta]=sequence
                currentFasta = re.findall('[a-zA-Z0-9]+', line[1:])[0]
                sequence = ''
            else:
                sequence += re.match(r'\S+', line).group()
    else:
        fasta[currentFasta]=sequence
    f.close()
    
    return {'contigs': contigs, 'records': records, 'fasta': fasta}