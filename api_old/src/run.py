#coding=utf-8
#!/usr/bin/python
import os
from flask import Flask, request
from flask_restful import Resource, Api, abort
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)
api = Api(app)


# @app.route('/')
# def home():
#     return {'foo':'bar'}
class HelloWorld(Resource):
    def get(self):
        return {'hello': 'world'}

class Files(Resource):
    def get(self):
        lst = sorted(os.listdir('./dna_source'))
        return {'files': lst}

class File(Resource):
    def get(self, file_name):
        if '/' in file_name:
            abort(404, message='/ is not allowed')
        file_path = './dna_source/' + file_name
        if not os.path.isfile(file_path):
            abort(404, message='not a file')
        
        with open(file_path) as fp:
            content = json.load(fp)
        return {'blocks': content}
    
api.add_resource(HelloWorld, '/')
api.add_resource(Files,'/api/files')
api.add_resource(File,'/api/file/<file_name>')

def start():
    app.run()

if __name__ == '__main__':
    app.run(debug=True)