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
import {Project, User, AnnotationPart, IProjectModel, IProjectFolderModel} from '../models';

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pushHistory } from './project';
import conf from '../conf';

import {readSequenceFromSequenceRef, generateSequenceRef} from '../sequenceRef';

export interface IRange {
  start: number,
  end: number,
}

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

export const projectToGFFJSONPartial = async (_id:string|mongoose.Types.ObjectId, range:IRange)=>{
  const {start, end} = range;

  const project = await Project
  .findById(_id)
  .populate({
    path:'parts',
    match: { 
      start: { $gte: range.start },
      end: { $lte: range.end },
      featureType: {$ne:'unknown'},
    },
  })
  .exec();

  let projectSequence = '';
  

  if(project.sequenceRef && project.sequenceRef.fileName) {
    const {fileName, strand} = project.sequenceRef;
    projectSequence = await readSequenceFromSequenceRef({fileName, start, end, strand});
  }

  const newRecord = project.toObject().parts.map(part=>({
    ...part, 
    chrName: project.name, 
    start: part.start - start, 
    end: part.end - start}));

  const gffJson:IGFFJSON = {
    mimetype: 'application/gffjson',
    version: "0.2",
    seqInfo: {
      [project.name]: {length: range.end-range.start}
    },
    records: newRecord.filter(part=>part.featureType !== 'unknown'),
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
  // console.log(gffJson);
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
      if (!sequenceHash) sequenceHash = crypto.createHash('md5').update(partSeq).digest("hex");
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
  // console.log(newObj.changelog);
  const newItem = await Project.create(newObj);
  // old project become history
  await Project.update({_id:project._id}, {ctype:'history'});

  return newItem;
}

export const updateProjectByGFFJSONPartial = async (project:IProjectModel,
                                                    gffJson:IGFFJSON,
                                                    range:IRange,
                                                    options?:{
                                                    },
                                                    progressCallBack?:(progress:number, message:string)=>{},
                                                    ) => {
  if (gffJson.mimetype !== 'application/gffjson' && gffJson.mimetype !== 'application/gffjson-head' ) {
    throw new Error('cannot hanle mimetype '+ gffJson.mimetype);
  }
  let newParts = [];
  let reuseSequence = false;
  // save sequence to file
  let projectSequenceRef:ISequenceRef;
  // console.log(gffJson);
  if (gffJson.mimetype === 'application/gffjson') {
    const originalSequence = await readSequenceFromSequenceRef(project.sequenceRef);
    const partialSequence = gffJson.sequence[gffJson.defaultChr];
    // merge partialSequence to originalSequence
    const newSeqBuilder = [];
    let originalSequenceMark = 0;
    newSeqBuilder.push(originalSequence.substring(originalSequenceMark, range.start))
    newSeqBuilder.push(partialSequence);
    newSeqBuilder.push(originalSequence.substring(range.end))
    const newSequence = newSeqBuilder.join('');
    projectSequenceRef = await generateSequenceRef(newSequence);
  } else {
    // gffJson doesn't have sequence, reuse the project sequence;
    reuseSequence = true;
    projectSequenceRef = project.sequenceRef;
  }

  const recordLength = gffJson.records.length;
  let recordCount = 0;

  // copy old features here if it's out of range

  let partsOnLeft = await AnnotationPart.find({
    _id:{$in:project.parts},
    start: {$lt: range.start},
    featureType: {$ne: 'unknown'},
  }).sort({start:1}).exec();
  newParts = partsOnLeft.map(v=>v._id);

  const partsOnRight = await AnnotationPart.find({
    _id:{$in:project.parts},
    start: {$gte: range.start},
    end: {$gt: range.end},
    featureType: {$ne: 'unknown'}
  }).sort({start:1}).exec();

  for(const record of gffJson.records) {
    // add offset because it's an partial
    record.start += range.start;
    record.end += range.start;

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
      if (!sequenceHash) sequenceHash = crypto.createHash('md5').update(partSeq).digest("hex");
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
  
  // if the length of gffJson = range, we don't change the parts on the right
  if( gffJson.mimetype === 'application/gffjson-head' ||
      gffJson.mimetype === 'application/gffjson' &&
      gffJson.seqInfo[gffJson.defaultChr].length === range.end - range.start
    ) {
    newParts = newParts.concat(partsOnRight.map(v=>v._id));
  } else {
    const offset =  gffJson.seqInfo[gffJson.defaultChr].length - (range.end - range.start);
    // shift all parts on the right
    newParts = newParts.concat(await Promise.all(partsOnRight.map(async (part)=>{
      const partObj = part.toObject();

      const newAnnotation = await AnnotationPart.create({
        ...partObj,
        _id:undefined,
        start:part.start + offset,
        end:part.end + offset,
        history: [{_id: partObj._id, updatedAt: partObj.updatedAt, changelog: partObj.changelog}],
        original:false,
        sequenceRef: {fileName: projectSequenceRef.fileName, start: part.start + offset, end: part.end + offset, strand: part.strand},
        built: true,
        updatedAt: new Date(),
        changelog: 'moved because ' + gffJson.__changelog,
      });

      return newAnnotation._id;
    })))
  }

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
  // console.log(newObj.changelog);
  const newItem = await Project.create(newObj);
  // old project become history
  await Project.update({_id:project._id}, {ctype:'history'});

  return newItem;
}

