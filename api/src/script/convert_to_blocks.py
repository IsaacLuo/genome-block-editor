import json
import gff2json

def gff_json_to_block_json(gff_json_file_name, block_json_file_name, species, sample_name):
    with open(gff_json_file_name) as fp:
        dct = {}
        content = json.load(fp)
        for record in content['records']:
            if record['seqName'] not in dct:
                dct[record['seqName']] = []

            feature = {
                'featureType':record['feature'],
                'sample_name': sample_name,
                'species': species,
                'chrId': int(record['seqName'][3:]),
                'chrName': record['seqName'],
                'name':record['attribute']['Name'],
                'start':record['start'],
                'end':record['end'],
                'len':record['end']-record['start'],
                'strand':record['strand'],
                'frame':record['frame'],
                'seq':content['fasta'][record['seqName']][record['start']:record['end']],
                'attribute': record['attribute'],
                'original': True,
            }
            dct[record['seqName']].append(feature)

    final_dct = {}

    for key in dct.keys():
        features = dct[key]
        features.sort(key=lambda x: x['start'])
        final_features = []
        if len(features) == 0:
            abort(404, message='no feature')
        print(features[0])
        if features[0]['start'] > 0:
            final_features.append({
                'featureType': 'unknown',
                'sample_name': sample_name,
                'species': species,
                'chrId': features[0]['chrId'],
                'chrName': features[0]['chrName'],
                'name': 'unkonwn',
                'start': 0,
                'end': features[0]['start'],
                'len': features[0]['start'],
                'strand': '.',
                'seq':content['fasta'][key][features[0]['start']:features[0]['end']],
                'original': True,
            })
        final_features.append(features[0])

        for i in range(1,len(features)):
            if features[i]['start'] > features[i-1]['end']:
                final_features.append({
                    'featureType': 'unknown',
                    'sample_name': sample_name,
                    'species': species,
                    'chrId': features[i]['chrId'],
                    'chrName': features[i]['chrName'],
                    'name': 'unkonwn',
                    'start': features[i-1]['end'],
                    'end': features[i]['start'],
                    'len': features[i]['start'] - features[i-1]['end'],
                    'strand': '.',
                    'seq':content['fasta'][key][features[i-1]['end']:features[i]['start']],
                    'original': True,
                })
            final_features.append(features[i])

        final_dct[key] = final_features
        
        # with open(key, 'w') as fp:
        #     json.dump(final_features, fp)

    with open(block_json_file_name, 'w') as fp:
            json.dump(final_dct, fp, indent=4)

