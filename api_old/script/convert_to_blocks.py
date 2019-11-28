import json

with open('BY4741.json') as fp:
    dct = {}
    content = json.load(fp)
    for record in content['records']:
        if record['seqName'] not in dct:
            dct[record['seqName']] = []

        feature = {
            'name':record['attribute']['Name'],
            'feature':record['feature'],
            'start':record['start'],
            'end':record['end'],
            'strand':record['strand'],
            'seq':content['fasta'][record['seqName']][record['start']:record['end']],
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
            'name': 'unkonwn',
            'feature': 'unknown',
            'start': 0,
            'end': features[0]['start'],
            'strand': '.',
            'seq':content['fasta'][key][features[0]['start']:features[0]['end']],
        })
    final_features.append(features[0])

    for i in range(1,len(features)):
        if features[i]['start'] > features[i-1]['end']:
            final_features.append({
                'name': 'unkonwn',
                'feature': 'unknown',
                'start': features[i-1]['end'],
                'end': features[i]['start'],
                'strand': '.',
                'seq':content['fasta'][key][features[i-1]['end']:features[i]['start']],
            })
        final_features.append(features[i])
    
    with open(key, 'w') as fp:
        json.dump(final_features, fp)

