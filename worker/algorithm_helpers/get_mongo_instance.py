from pymongo import MongoClient
import json

with open('./conf.json', encoding='utf-8') as fp:
    conf = json.load(fp)

def get_mongo_instance():
    mongo_url = conf['secret']['mongoDB']['url']
    db = MongoClient(mongo_url).get_default_database()
    return db