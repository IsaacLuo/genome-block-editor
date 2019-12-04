import json

with open('BY4741.json') as fp:
    species = 'BY4741'
    dct = {}
    content = json.load(fp)
    for chrId, record in enumerate(content['records']):
        if record['seqName'] not in dct:
            dct[record['seqName']] = []

        feature = {
            'featureType':record['feature'],
            'species': species,
            'chrId': chrId,
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
    
    with open(key, 'w') as fp:
        json.dump(final_features, fp)
