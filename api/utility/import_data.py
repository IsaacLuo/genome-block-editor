import pymongo
import json
import sys
import os
import re
from bson.objectid import ObjectId
from read_gff import GFFReader
import shutil
import hashlib
import datetime

strand_dict={"+":1, "-":-1, ".":0}


def rc(seq):
    d = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'}
    return ''.join([d[x] for x in list(seq[::-1])])

configJsonFilePath = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src', 'conf.json'))
if not os.path.isfile(configJsonFilePath):
    print('conf file not exists', file=sys.stderr)
with open(configJsonFilePath, 'r') as fp:
    conf = json.load(fp)

black_list_feature = ['contig', 'region']

conf_mongo = conf['secret']['mongoDB']
# mongo_uri, mongo_db, mongo_auth = re.findall(r'^(.+)/(.+)\?authSource=(.+)',conf_mongo['url'])[0]
# client = pymongo.MongoClient(conf_mongo['url'], username=conf_mongo['username'], password=conf_mongo['password'])
mongo_uri, mongo_db_rest_part = re.findall(r'^(.+)/(.+)',conf_mongo['url'])[0]
client = pymongo.MongoClient(conf_mongo['url'])
mongo_db =  mongo_db_rest_part.split('?')[0]
db = client[mongo_db]
ProjectFolder = db['project_folders']
Project = db['projects']
Parts = db['annotation_parts']

# sequence_dir = os.path.abspath(os.path.join(os.path.curdir,'..','public', 'sequences'))
sequence_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'sequences'))


def search_folder(root_folder, root_folder_name):
    folders = []
    gff_files = []
    for file_folder_name in os.listdir(root_folder):
        if file_folder_name[0] == '_':
            continue
        file_folder_path = os.path.join(root_folder, file_folder_name)
        if os.path.isdir(file_folder_path):
            folders.append(file_folder_name)
        elif os.path.isfile(file_folder_path) and file_folder_name[-4:] == '.gff':
            gff_files.append(file_folder_name)

    subFolder_ids = [search_folder(os.path.join(root_folder, folder), folder) for folder in folders]
    project_ids = [import_project(os.path.join(root_folder, filename), os.path.splitext(filename)[0]) for filename in gff_files]

    insert_result = ProjectFolder.insert_one({"name":root_folder_name, "subFolders": subFolder_ids + project_ids, "projects": []})
    if insert_result.acknowledged:
        return insert_result.inserted_id
    else:
        return None

# import project from gff file
# @file_path: the gff file path
def import_project(file_path, project_name):

    _, file_name = os.path.split(file_path)

    default_changelog = 'imported from file "{}"'.format(file_name)

    fasta_file_name = os.path.splitext(file_path)[0] + '.fa'
    if not os.path.isfile(fasta_file_name):
        fasta_file_name = None

    project_ids = []
    project_name_id_dict = {}
    chr_count = 0
    seq_dict = {}
    unused_ids = set()

    gff_reader = GFFReader(file_path, fasta_file_name, sequence_dir=sequence_dir, db=db)
    count = 0

    now = datetime.datetime.utcnow()

    for record in gff_reader.read_gff(True):
        count+=1
        if count%100 == 0:
            print('imported {} records                          '.format(count), end='\r')
        name = 'unknown'
        if 'ID' in record['attribute']:
            name = record['attribute']['ID']
        if 'Name' in record['attribute']:
            name = record['attribute']['Name']
        if 'Alias' in record['attribute']:
            name = record['attribute']['Alias']

        if 'Parent' in record['attribute']:
            parent_name = record['attribute']['Parent']
            if parent_name in project_name_id_dict:
                parent_id = project_name_id_dict[parent_name]
            else:
                parent_id = ObjectId()
                print('creating parent id <<<<<<<<<<<<<<<<<<<<<<<')
                project_name_id_dict[parent_name] = parent_id
                unused_ids.add(parent_id)
        else:
            parent_id = None

        sequenceHash = ''
        if 'sequence' in record:
            seq = record['sequence']
            # if record['strand'] == -1 or record['strand'] == '-':
                # seq = rc(seq)
            sequenceHash = hashlib.md5(seq.encode())
            seqeunceHash = sequenceHash.hexdigest()
        
        if record['seqName'] not in seq_dict:
            seq_dict[record['seqName']] = {
                "name": '{}_{}'.format(project_name, record['seqName']),
                "seqName": record['seqName'],
                "version": "0.1",
                "chrId": chr_count,
                "parts_raw": [],
                "chrFileName": record['chrFileName'],
                "original": True,
            }
            chr_count+=1
            print('new seq_dict', record['seqName'])
        
        if record['feature'] not in black_list_feature and record['start'] != 0:
            
            if 'ID' in record['attribute'] and record['attribute']['ID'] in project_name_id_dict:
                part_id = project_name_id_dict[record['attribute']['ID']]
                # print('reuse existing id>>>>>>>>>>>>>>>>>>>>>>>>>>> ', record['attribute']['ID'])
                if part_id in unused_ids:
                    unused_ids.remove(part_id)
                else:
                    part_id = ObjectId()
                
            else:
                part_id = ObjectId()

            # print(name)
            try:
                # find_result = Parts.find_one({"_id":part_id})
                # if find_result:
                #     # print('re assign a new id')
                #     part_id = ObjectId()
                insert_result = Parts.insert_one({
                    "_id":part_id,
                    "pid":ObjectId(),
                    "parent":parent_id,
                    "featureType":record['feature'],
                    "chrName": record['seqName'],
                    "chrId": seq_dict[record['seqName']]['chrId'],
                    "start": record['start'],
                    "end": record['end'],
                    "strand": strand_dict[record['strand']],
                    "attribute": record['attribute'],
                    "name": name,
                    
                    "original": True,
                    "history": [],

                    "sequenceHash": seqeunceHash,
                    "sequenceRef": {
                        "fileName": record['chrFileName'],
                        "start": record['start'],
                        "end": record['end'],
                        "strand": strand_dict[record['strand']],
                    },

                    "changelog": default_changelog,

                    "createdAt": now,
                    "updatedAt": now,
                })
                if insert_result.acknowledged:
                    seq_dict[record['seqName']]['parts_raw'].append({
                        "_id":insert_result.inserted_id,
                        "chrName": record['seqName'],
                        "chrId": seq_dict[record['seqName']]['chrId'],
                        "start": record['start'],
                        "end": record['end'],
                        "name": name,
                        "chrFileName": record['chrFileName'],
                    })
                    # insert name->id to dict
                    if 'ID' in record['attribute']:
                        project_name_id_dict[record['attribute']['ID']] = insert_result.inserted_id
                else:
                    # raise Exception('failed insert parts')
                    print('insert failed', str(insert_result))
            except Exception as err:
                print(err)

    # set parent id if exists:


    for k in seq_dict.keys():
        project = seq_dict[k]
        parts_raw = project['parts_raw']

    # insert "unknown" features between marked segements
    insert_unknown_parts = False

    for k in seq_dict.keys():
        project = seq_dict[k]
        parts_raw = project['parts_raw']
        if len(parts_raw) == 0:
            continue
        print('sorting parts for ', project['name'])
        # sort parts_raw
        parts_raw.sort(key=lambda x: x['start'])
        print('generating gap parts')
        #fill parts from parts_raw and fill empty area
        parts = []
        end_pos_of_unknown = 0

        for i, p in enumerate(parts_raw):
                if p['start']> end_pos_of_unknown:
                    start = end_pos_of_unknown
                    end = p['start']
                    if insert_unknown_parts:
                        insert_result = Parts.insert_one({
                            "pid":ObjectId(),
                            "parent": None,
                            "featureType": 'unknown',
                            "chrName": p['chrName'],
                            "chrId": p['chrId'],
                            "start": start,
                            "end": end,
                            "strand": 0,
                            "name": 'unknown',
                            "original": True,
                            

                            "history": [],

                            "sequenceHash": seqeunceHash,
                            "sequenceRef": {
                                "fileName": p['chrFileName'],
                                "start": start,
                                "end": end,
                                "strand": 0,
                            },

                            "changelog": default_changelog,

                            "createdAt": now,
                            "updatedAt": now,
                        })
                        if insert_result.acknowledged:
                            parts.append(insert_result.inserted_id)
                            
                        else:
                            raise Exception('failed insert parts')
                    count+=1
                    if count%100 == 0:
                        print('generated {} records                          '.format(count), end='\r')
                
                parts.append(p['_id'])
                if end_pos_of_unknown < p['end']:
                    end_pos_of_unknown = p['end']

        wholeSequence = gff_reader.get_fasta_db().find(project['seqName'])
        project['len'] = len(wholeSequence)
        if insert_unknown_parts:
            # use last blank space
            if end_pos_of_unknown < project['len']:
                start = end_pos_of_unknown
                end = project['len']
                insert_result = Parts.insert_one({
                    "pid":ObjectId(),
                    "parent": None,
                    "featureType": 'unknown',
                    "chrName": p['chrName'],
                    "chrId": p['chrId'],
                    "start": start,
                    "end": end,
                    "strand": 0,
                    "name": 'unknown',
                    "original": True,

                    "sequenceHash": seqeunceHash,
                    "sequenceRef": {
                        "fileName": p['chrFileName'],
                        "start": start,
                        "end": end,
                        "strand": 0,
                    },

                    "changelog": default_changelog,

                    "createdAt": now,
                    "updatedAt": now,
                })
                if insert_result.acknowledged:
                    parts.append(insert_result.inserted_id)
                else:
                    raise Exception('failed insert parts')

        print('generated {} records                          '.format(count))

        # insert projrct
        
        wholeSequenceHash = hashlib.md5(wholeSequence.encode()).hexdigest()
        insert_result = Project.insert_one({
            "name": project['name'],
            "projectId": ObjectId(),
            "version": project['version'],
            "parts": parts,
            "len": project['len'],
            "history": [],
            "sequenceHash": wholeSequenceHash,
            "sequenceRef":{
                "fileName":project['chrFileName'],
                "start": 0,
                "end": project['len'],
                "strand": 0,
            },
            "ctype": "source",

            "changelog": default_changelog,
            "built": True,

            "createdAt": now,
            "updatedAt": now,
            'seqName': project['seqName']
        })
        print('project ', project['name'], len(parts))

        if insert_result.acknowledged:
            project_ids.append(insert_result.inserted_id)
        else:
            raise Exception('failed create project')

    insert_result = ProjectFolder.insert_one({"name":project_name, "subFolders": [], "projects": project_ids})
    if insert_result.acknowledged:
        return insert_result.inserted_id
    else:
        return None

def remove_all_files(dir):
    for fileName in os.listdir(dir):
        if fileName[0] != '.':
            os.remove(os.path.join(dir, fileName))



def main():
    # base_dir = os.path.abspath(os.path.join(os.path.curdir,'..','..', 'gff'))
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'gff'))

    ProjectFolder.delete_many({})
    Project.delete_many({})
    Parts.delete_many({})

    remove_all_files(sequence_dir)
    remove_all_files(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'sourceFileCaches')))


    source_file_folder_id = search_folder(base_dir, 'Source Files')
    insert_result = ProjectFolder.insert_one({"name":'Project Files', "subFolders": [], "projects": []})
    insert_result = ProjectFolder.insert_one({"_id":ObjectId('000000000000000000000000'), "name":"/", "subFolders": [source_file_folder_id, insert_result.inserted_id, ], "projects": []})
    print('done')

if __name__ == "__main__":
    main()