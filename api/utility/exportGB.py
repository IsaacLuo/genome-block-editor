from Bio import SeqIO
from Bio.SeqFeature import SeqFeature, FeatureLocation
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio.Alphabet import DNAAlphabet
import json
import sys
import io
import random
import string

def randomString(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

inp = input()
# print(inp, file=sys.stderr)
# with open('x.txt', 'w') as fp:
#     fp.write(inp)
project = json.loads(inp)
blocks = project['parts']
seq = ''
features = []
strand_dict = {"+":1, "-": -1, ".": 0}
for block in blocks:
    seq += block['sequence']
    features.append(
        SeqFeature(
            FeatureLocation(
                block['start'], 
                block['end'], 
                strand=strand_dict[block['strand']]
            ),
        type=block['featureType'],
        id=block['name'])
    )

sequence = Seq(seq, DNAAlphabet())
# features = [SeqFeature(FeatureLocation(1, 3, strand=1), type="CDS"), SeqFeature(FeatureLocation(5, 7, strand=-1), type="intron", id="someid",qualifiers={"quqqli":"bar"})]
seqRecord = SeqRecord(sequence, features=features)
# print(seqRecord)
# fp = io.StringIO()
# # with open('temp.gb', 'w') as fp:
fileName = '%s.gb'%randomString()
SeqIO.write(seqRecord, '../public/genbank/%s'%fileName, 'genbank')
print(json.dumps({"fileURL": 'genbank/%s'%fileName}))
# print(json.dumps({"gb":fp.getvalue()}))