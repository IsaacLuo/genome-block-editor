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

def main():
    print('start')
    print('deleting ProjectFolder')
    ProjectFolder.delete_many({})
    print('deleting Project')
    Project.delete_many({})
    print('deleting Parts')
    Parts.delete_many({})
    print('done')

if __name__ == "__main__":
    main()