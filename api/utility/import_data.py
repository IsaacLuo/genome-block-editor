import pymongo
import json
import sys
import os
import re
from bson.objectid import ObjectId
from read_gff import read_gff

strand_dict={"+":1, "-":-1, ".":0}

if not os.path.isfile('conf.json'):
    print('conf file not exists', file=sys.stderr)
with open('conf.json', 'r') as fp:
    conf = json.load(fp)

conf_mongo = conf['secret']['mongoDB']
mongo_uri, mongo_db, mongo_auth = re.findall(r'^(.+)/(.+)\?authSource=(.+)',conf_mongo['url'])[0]
client = pymongo.MongoClient(conf_mongo['url'], username=conf_mongo['username'], password=conf_mongo['password'])
db = client[mongo_db]
ProjectFolder = db['project_folders']
Project = db['projects']
Parts = db['annotation_parts']

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

def import_project(file_path, project_name):
    fasta_file_name = os.path.splitext(file_path)[0] + '.fa'
    if not os.path.isfile(fasta_file_name):
        fasta_file_name = None

    project_ids = []
    
    parts = []
    chr_length = 0
    chr_count = 0
    seq_dict = {}

    for record in read_gff(file_path, fasta_file_name):
        name = 'unknown'
        if 'ID' in record['attribute']:
            name = record['attribute']['ID']
        if 'alias' in record['attribute']:
            name = record['attribute']['alias']
        if chr_length < record['end']:
            chr_length = record['end']
        
        if record['seqName'] not in seq_dict:
            seq_dict[record['seqName']] = {
                "name": '{}_{}'.format(project_name, record['seqName']),
                "version": "0.1",
                "parts": parts,
                "len": chr_length,
                "chrId": chr_count,
                "parts": [],
            }
            chr_count+=1
            
        insert_result = Parts.insert_one({
            "featureType":record['feature'],
            "chrName": record['seqName'],
            "chrId": seq_dict[record['seqName']]['chrId'],
            "start": record['start'],
            "end": record['end'],
            "strand": strand_dict[record['strand']],
            "attribute": record['attribute'],
            "sequence": record['sequence'],
            "name": name,
        })
        if insert_result.acknowledged:
            seq_dict[record['seqName']]['parts'].append(insert_result.inserted_id)
        else:
            raise Exception('failed insert parts')
    
    for k in seq_dict.keys():
        project = seq_dict[k]
        insert_result = Project.insert_one({
            "name": project['name'],
            "version": project['version'],
            "parts": project['parts'],
            "len": project['len'],
        })
        print('project ', project['name'], len(project['parts']))

    if insert_result.acknowledged:
        project_ids.append(insert_result.inserted_id)
    else:
        raise Exception('failed create project')

    insert_result = ProjectFolder.insert_one({"name":project_name, "subFolders": [], "projects": project_ids})
    if insert_result.acknowledged:
        return insert_result.inserted_id
    else:
        return None

def main():
    base_dir = os.path.abspath(os.path.join(os.path.curdir,'..','..', 'gff'))
    search_folder(base_dir, '/')
    
    print('done')

if __name__ == "__main__":
    main()