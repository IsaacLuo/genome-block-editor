import pymongo
import json
import sys
import os
import re
from bson.objectid import ObjectId
from read_gff import read_gff


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

def search_folder(root_folder, root_folder_name):
    folders = []
    gff_files = []
    for file_folder_name in os.listdir(root_folder):
        file_folder_path = os.path.join(root_folder, file_folder_name)
        if os.path.isdir(file_folder_path):
            folders.append(file_folder_name)
        elif os.path.isfile(file_folder_path) and file_folder_name[-4:] == '.gff':
            gff_files.append(file_folder_name)

    subFolder_ids = [search_folder(os.path.join(root_folder, folder), folder) for folder in folders]
    project_ids = [import_project(os.path.join(root_folder, filename), filename) for filename in gff_files]

    insert_result = ProjectFolder.insert_one({"name":root_folder_name, "subFolders": subFolder_ids, "projects": project_ids})
    if insert_result.acknowledged:
        return insert_result.inserted_id
    else:
        return None

def import_project(file_path, project_name):
    fasta_file_name = os.path.splitext(file_path)[0] + '.fa'
    if not os.path.isfile(fasta_file_name):
        fasta_file_name = None
    for record in read_gff(file_path, fasta_file_name):
        print(record)
    return None

def main():
    base_dir = os.path.abspath(os.path.join(os.path.curdir,'..','..', 'gff'))
    ProjectFolder.delete_many({})
    search_folder(base_dir, '/')
    
    print('done')

if __name__ == "__main__":
    main()