import pymongo
import json
import sys
import os
import re
from bson.objectid import ObjectId
from read_gff import GFFReader
import shutil

strand_dict={"+":1, "-":-1, ".":0}

if not os.path.isfile('conf.json'):
    print('conf file not exists', file=sys.stderr)
with open('conf.json', 'r') as fp:
    conf = json.load(fp)

black_list_feature = ['contig', 'region']

conf_mongo = conf['secret']['mongoDB']
mongo_uri, mongo_db, mongo_auth = re.findall(r'^(.+)/(.+)\?authSource=(.+)',conf_mongo['url'])[0]
client = pymongo.MongoClient(conf_mongo['url'], username=conf_mongo['username'], password=conf_mongo['password'])
db = client[mongo_db]
ProjectFolder = db['project_folders']
Project = db['projects']
Parts = db['annotation_parts']

sequence_dir = os.path.abspath(os.path.join(os.path.curdir,'..','public', 'sequences'))

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
    chr_count = 0
    seq_dict = {}

    gff_reader = GFFReader(file_path, fasta_file_name, sequence_dir=sequence_dir, db=db)
    count = 0
    for record in gff_reader.read_gff():
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
        
        if record['seqName'] not in seq_dict:
            seq_dict[record['seqName']] = {
                "name": '{}_{}'.format(project_name, record['seqName']),
                "version": "0.1",
                "len": record['end'],
                "chrId": chr_count,
                "parts_raw": [],
                "chrFileName": record['chrFileName'],
                "original": True,
            }
            chr_count+=1
        else:
            proj = seq_dict[record['seqName']]
            if proj['len'] < record['end']:
                proj['len'] = record['end']
        
        if record['feature'] not in black_list_feature and record['start'] != 0:
            insert_result = Parts.insert_one({
                "featureType":record['feature'],
                "chrName": record['seqName'],
                "chrId": seq_dict[record['seqName']]['chrId'],
                "start": record['start'],
                "end": record['end'],
                "strand": strand_dict[record['strand']],
                "attribute": record['attribute'],
                "name": name,
                "chrFileName": record['chrFileName'],
                "original": True,
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
            else:
                raise Exception('failed insert parts')

    def build_index(self):
        self.check_file_object()
        self.file_obj.seek(0)
        it = 0
        seq_name = ''
        for line_raw in self.file_obj:
            line = line_raw.decode('utf-8').strip()
            if line[0] == '>':
                seq_name = line[1:]
            elif seq_name not in self.seq_index:
                self.seq_index[seq_name] = it
                print(seq_name, it)
            it += len(line_raw)

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
                insert_result = Parts.insert_one({
                    "featureType": 'unknown',
                    "chrName": p['chrName'],
                    "chrId": p['chrId'],
                    "start": end_pos_of_unknown,
                    "end": p['start'],
                    "strand": 0,
                    "name": 'unknown',
                    "chrFileName": p['chrFileName'],
                    "original": True,
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

        # use last blank space
        if end_pos_of_unknown < project['len']:
            insert_result = Parts.insert_one({
                "featureType": 'unknown',
                "chrName": p['chrName'],
                "chrId": p['chrId'],
                "start": end_pos_of_unknown,
                "end": project['len'],
                "strand": 0,
                "name": 'unknown',
                "chrFileName": p['chrFileName'],
                "original": True,
            })
            if insert_result.acknowledged:
                parts.append(insert_result.inserted_id)
            else:
                raise Exception('failed insert parts')

        print('generated {} records                          '.format(count))


        insert_result = Project.insert_one({
            "name": project['name'],
            "version": project['version'],
            "parts": parts,
            "len": project['len'],
            "chrFileName": project['chrFileName'],
            "ctype": "source",
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

def main():
    base_dir = os.path.abspath(os.path.join(os.path.curdir,'..','..', 'gff'))
    search_folder(base_dir, '/')
    
    print('done')

if __name__ == "__main__":
    main()