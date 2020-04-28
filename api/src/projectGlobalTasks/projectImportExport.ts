import mongoose from 'mongoose';
import { 
    saveProject, 
    deleteProject, 
    loadProjectStr, 
    saveProjectStr, 
    loadProjectIdStr,
    saveProjectIdStr,
} from '../redisCache';
import fs from 'fs';
import {Project, User, AnnotationPart, IProjectModel} from '../models';

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pushHistory } from './project';
import conf from '../conf';

import {readSequenceFromSequenceRef, generateSequenceRef} from '../sequenceRef';

// export const deleteFilesSequenceRef = async (sequenceRef: ISequenceRef, strand?:number) => {
//   // find if there is any project or part is using this sequenceRef

// }

export const projectToGFFJSON = async (_id:string|mongoose.Types.ObjectId, keepUnknown=false)=>{
  const project = await Project
  .findById(_id)
  .populate({
    path:'parts',
  })
  .exec();

  // rebuild sequence 

  let projectSequence = '';

  if(project.sequenceRef && project.sequenceRef.fileName) {
    projectSequence = await readSequenceFromSequenceRef(project.sequenceRef);
  }

  const newRecord = project.toObject().parts.map(part=>({...part, chrName: project.name}));

  // console.log('keepUnknown=',keepUnknown);

  const gffJson:IGFFJSON = {
    mimetype: 'application/gffjson',
    version: "0.2",
    seqInfo: {
      [project.name]: {length: project.len}
    },
    records: keepUnknown ? newRecord : newRecord.filter(part=>part.featureType !== 'unknown'),
    sequence: {
      [project.name]: projectSequence
    },
    defaultChr: project.name,
    history:[],
  }

  return gffJson;
}

export const updateProjectByGFFJSON = async ( project:IProjectModel,
                                              gffJson:IGFFJSON,
                                              options?:{
                                              },
                                              progressCallBack?:(progress:number, message:string)=>{},
                                              ) => {

  if (gffJson.mimetype !== 'application/gffjson' && gffJson.mimetype !== 'application/gffjson-head' ) {
    throw new Error('cannot hanle mimetype '+ gffJson.mimetype);
  }
  const newParts = [];
  let reuseSequence = false;
  // save sequence to file
  let projectSequenceRef:ISequenceRef;
  console.log(gffJson);
  if (gffJson.mimetype === 'application/gffjson') {
    projectSequenceRef = await generateSequenceRef(gffJson.sequence[gffJson.defaultChr]);
  } else {
    // gffJson doesn't have sequence, reuse the project sequence;
    reuseSequence = true;
    projectSequenceRef = project.sequenceRef;
  }

  const recordLength = gffJson.records.length;
  let recordCount = 0;
  for(const record of gffJson.records) {
    recordCount++;
    if (progressCallBack) {
      progressCallBack(recordCount/recordLength, `${recordCount}/${recordLength}`);
    }
    if (record.__modified || !record._id) {
      // need to create new part
      const dateNow = new Date();
      let partSeq;
      let partSequenceRef;
      if (reuseSequence) {
        partSequenceRef = {fileName: project.sequenceRef.fileName, start: record.start, end:record.end, strand: record.strand };
        partSeq = await readSequenceFromSequenceRef(partSequenceRef);  
      } else {
        partSeq = gffJson.sequence[record.chrName].substring(record.start, record.end);
        partSequenceRef =  {
          fileName: projectSequenceRef.fileName,
          start: record.start,
          end: record.end,
          strand: record.strand,
        }
      }
      let sequenceHash = record.sequenceHash;
      if (sequenceHash) sequenceHash = crypto.createHash('md5').update(partSeq).digest("hex");
      const newPartTable = {
        history: [],
        ...record,
        original: false,
        createdAt: dateNow,
        updatedAt: dateNow,
        sequenceHash,
        sequenceRef: partSequenceRef,
        changelog: record.__changelog,
      };

      if (record._id) {
        const oldRecord = await AnnotationPart.findById(record._id).exec();
        newPartTable.history = [{
          _id: oldRecord._id,
          updatedAt: oldRecord.updatedAt,
          changelog: oldRecord.changelog,
        }, ...newPartTable.history];
        delete newPartTable._id;
      }
      // create new feature
      const newAnnotation = await AnnotationPart.create(newPartTable);
      newParts.push(newAnnotation._id);
    } else {
      newParts.push(record._id);
      // the sequenceRef hasn't change, but I don't think it does a matter (for now)
    }
  }
  // create new unknown parts
  // const unknownParts = await AnnotationPart.find({_id:{$in:project.parts}, featureType:'unknown'});
  

  // create new project, save current one as history
  let newObj = project;
  if (project.constructor.name === 'model') {
    // object is mongoose object
    newObj = newObj.toObject();
  }
  pushHistory(newObj);
  newObj.parts = newParts;
  newObj.changelog = gffJson.__changelog;
  newObj.sequenceRef = projectSequenceRef;
  delete newObj.updatedAt;
  delete newObj._id;
  console.log(newObj.changelog);
  const newItem = await Project.create(newObj);
  // old project become history
  await Project.update({_id:project._id}, {ctype:'history'});

  return newItem;
}



