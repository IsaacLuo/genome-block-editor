from pymongo import MongoClient
import pymongo
from bson.objectid import ObjectId
from algorithm_helpers.get_mongo_instance import get_mongo_instance
from algorithm_helpers.percentage import PercentageCounter
import datetime
import time
from munch import Munch, munchify


def create_promoter_terminator(project_id, promoter_length, terminator_length, **kwargs):
    db = get_mongo_instance()
    project_models = db.projects
    project = munchify(project_models.find_one({'_id':ObjectId(project_id)}))
    
    part_search_condition = {
        '_id':{'$in': project['parts']},
        'featureType': 'gene',
    }
    if 'start' in kwargs:
        part_search_condition['start'] = {'$gte': kwargs['start']}
    if 'end' in kwargs:
        part_search_condition['end'] =  {'$lt': kwargs['end']}    
    genes = db.annotation_parts.find(part_search_condition).sort([('start',pymongo.ASCENDING), ('end',pymongo.DESCENDING)])
    genes_len = genes.count()
    
    project_log = {
        '_id':None,
        'conflictParts': [],
        'modifiedParts': [],
        'createdParts': [],
        'deletedParts': [],
        'shiftedParts': [],
    }
    
    percentage_counter = PercentageCounter()
    percentage_counter.set_count_range(10, 90, genes_len)
    parts_count = 0
    
    now = datetime.datetime.now()
    new_part_list = []
    new_part_id_list = []
    
    replace_id_map = {}
    
    for part in genes:
        part = munchify(part)
        parts_count += 1
        progress_message = percentage_counter.build_message_by_count(parts_count, 'now doing {}/{}'.format(parts_count, genes_len))
        if progress_message:
            yield progress_message
        
        pro_name = part.name + '_P'
        ter_name = part.name + '_T'
        if part.strand == -1:
            pro_start = part.end
            pro_end = part.end + promoter_length
            if pro_end > project.len:
                pro_end = project.len
            ter_end = part.start
            ter_start = part.start - terminator_length
            if ter_start < 0:
                ter_start = 0
        else:
            pro_start = part.start - promoter_length
            pro_end = part.start
            if pro_start < 0:
                pro_start = 0
            ter_start = part.end
            ter_end = part.end + terminator_length
            if ter_end > project.len:
                ter_end = project.len
        # create parts
        promoter = Munch({
            '_id': ObjectId(),
            'pid': ObjectId(),
            'featureType': 'promoter',
            'chrId': part.chrId,
            'chrName': part.chrName,
            'start': pro_start,
            'end': pro_end,
            'len': pro_end - pro_start,
            'strand': part.strand,
            'name': pro_name,
            'original': False,
            'history': [],
            'sequenceRef': {
                'fileName': part.sequenceRef.fileName, 
                'start': pro_start, 
                'end': pro_end, 
                'strand': part.strand,
            },
            'built': False,
            'parent': None,
            'attribute': {'ID':pro_name},
            'createdAt':now,
            'updatedAt':now,
            'changelog': 'created {}bp promoter for {}'.format(promoter_length, part.name),
        })
        new_part_list.append(promoter.toDict())
        
        project_log['createdParts'].append({
            'ctype': 'new',
            'part': promoter._id,
            'name': promoter.name,
            'changelog': promoter.changelog,
            'location': promoter.start,
            'oldPart': None,
        })

        terminator = Munch({
            '_id': ObjectId(),
            'pid': ObjectId(),
            'featureType': 'terminator',
            'chrId': part.chrId,
            'chrName': part.chrName,
            'start': ter_start,
            'end': ter_end,
            'len': ter_end - ter_start,
            'strand': part.strand,
            'name': ter_name,
            'original': False,
            'history': [],
            'sequenceRef': {
                'fileName': part.sequenceRef.fileName, 
                'start': ter_start, 
                'end': ter_end, 
                'strand': part.strand,
            },
            'built': False,
            'parent': None,
            'attribute': {'ID':ter_name},
            'createdAt':now,
            'updatedAt':now,
            'changelog': 'created {}bp terminator for {}'.format(terminator_length, part.name),
        })
        new_part_list.append(terminator.toDict())
        
        project_log['createdParts'].append({
            'ctype': 'new',
            'part': terminator._id,
            'name': terminator.name,
            'changelog': terminator.changelog,
            'location': terminator.start,
            'oldPart': None,
        })
        if part.strand == -1:
            replace_id_map[part._id] = [terminator._id, part._id, promoter._id]
        else:
            replace_id_map[part._id] = [promoter._id, part._id, terminator._id]
        
        if len(new_part_list) >= 1000:
            x = db.abandon.insert_many(new_part_list)
            new_part_id_list += x.inserted_ids
            new_part_list = []
    if len(new_part_list) > 0:
        x = db.abandon.insert_many(new_part_list)
        new_part_id_list += x.inserted_ids
        new_part_list = []
        
    yield percentage_counter.build_message(92, 'saving history')
    
    new_parts = []
    for part_id in project.parts:
        if part_id in replace_id_map:
            new_parts += replace_id_map[part_id]
        else:
            new_parts.append(part_id)
    
    old_project_id = project._id
    old_project_ctype = project.ctype
    
    project.history = [{
        '_id': project._id,
        'updatedAt': project.updatedAt,
        'changelog': project.changelog,
    }] + project.history
    project._id = ObjectId()
    project.parts = new_parts
    project.ctype = 'project'
    project.changelog = 'created promoter and terminators'
    
    # create new project
    insert_result = db.projects.insert_one(project)
    if insert_result.acknowledged:
        # mark old project as history
        if old_project_ctype != 'source':
            modify_result = db.projects.update_one({'id':old_project_id}, { "$set": { "ctype": "history" } })
            if not modify_result.acknowledged:
                raise Exception('unable modify old project')
        yield percentage_counter.build_result(100, 'done', project._id)
    else:
        raise Exception('not inserted')
    
