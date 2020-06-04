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
import FormData from 'form-data';
import {Project, User, AnnotationPart, IProjectModel, IProjectFolderModel, IAnnotationPartModel} from '../models';

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { pushHistory } from './project';
import conf from '../conf';
import axios from 'axios';


import {readSequenceFromSequenceRef, generateSequenceRef} from '../sequenceRef';

export interface IRange {
  start: number,
  end: number,
}

export const updatePart = async (part:string|mongoose.Types.ObjectId|IAnnotationPartModel|IAnnotationPart, partForm:any) => {
  if (typeof(part) === 'string' || part instanceof mongoose.Types.ObjectId) {
    part = await AnnotationPart.findById(part);
  }
  if (part.constructor.name === 'model') {
    part = (part as IAnnotationPartModel).toObject();
  }

  part = part as IAnnotationPart;

  const history = [{
    _id: part._id,
    updatedAt: part.updatedAt,
    changelog: part.changelog,
  }, ...part.history];

  delete part._id;

  partForm = {...part, ...partForm, history, updatedAt: new Date()};

  const newPart = await AnnotationPart.create(partForm);

  return newPart;
}

export const updateProject = async (project:string|mongoose.Types.ObjectId|IProjectModel|IProject, projectForm:any, setOldProjectAsHistory:boolean = true) => {
  if (typeof(project) === 'string' || project instanceof mongoose.Types.ObjectId) {
    project = await Project.findById(project);
  }
  if (project.constructor.name === 'model') {
    project = (project as IProjectModel).toObject();
  }

  project = project as IProject;

  const history = [{
    _id: project._id,
    updatedAt: project.updatedAt,
    changelog: project.changelog,
  }, ...project.history];

  delete project._id;

  projectForm = {...project, ...projectForm, history, updatedAt: new Date()};

  const newProject = await Project.create(projectForm);

  if (setOldProjectAsHistory && project.ctype !== 'source') {
    await Project.updateOne({_id:project._id}, {ctype:'history'});
  }

  return newProject;
}

export const projectToGFFJSON = async (_id:string|mongoose.Types.ObjectId, keepUnknown=false)=>{
  const project = await Project
  .findById(_id)
  .populate({
    path:'parts',
  })
  .exec();

  let projectSequence = '';

  if(project.sequenceRef && project.sequenceRef.fileName) {
    projectSequence = await readSequenceFromSequenceRef(project.sequenceRef);
  }

  const newRecord = project.toObject().parts.map(part=>({...part, chrName: project.name}));

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

const updateParents = async (partIds:(string|mongoose.Types.ObjectId)[], 
                              upgradePartIdDict: {[key: string]:mongoose.Types.ObjectId},
                              upgradedPartIds: Set<string>,
                            )=>{
  let candidates = await AnnotationPart.find({_id:{$in:partIds}}).exec();
  // sort part ids by original order
  const partIdStrs = partIds.map(v=>v.toString());
  candidates.sort((a,b)=> partIdStrs.indexOf(a._id.toString()) - partIdStrs.indexOf(b._id.toString()));
  while(true) {
    // const ids = Array.from(upgradedPartIds);
    let breakLoop = true;
    // for (const part of candidates) {
    for (let i=0;i<candidates.length;i++) {
      const part = candidates[i];
      const partIdStr = part._id.toString();
      const partParentStr = part.parent?.toString();
      if (upgradePartIdDict[partParentStr]) {
        if (upgradedPartIds.has(partIdStr)) {
          // newly created parts, directly update it.
          part.parent = upgradePartIdDict[part.parent.toString()];
          await part.save();
          upgradedPartIds.add(partIdStr);
        } else {
          // existing parts, create an updated part
          const savedPart = await updatePart(part, {parent:upgradePartIdDict[part.parent.toString()]});
          upgradePartIdDict[partIdStr] = savedPart._id;
          upgradedPartIds.add(savedPart._id.toString());
          candidates[i] = savedPart;
        }
        breakLoop = false;
      }      
    }
    if (breakLoop) break;
  }
  return candidates;
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
  let newParts = [];
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

  const upgradePartIdDict = {};
  const upgradedPartIds = new Set<string>();

  // traverse the records, preset newId for every modified part
  for(const record of gffJson.records) {
    if (record.__modified && record._id) {
      upgradePartIdDict[record._id] = new mongoose.Types.ObjectId();
    }
  }

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
      const newPartForm:any = {
        ...record,
        original: false,
        createdAt: dateNow,
        updatedAt: dateNow,
        sequenceHash,
        sequenceRef: partSequenceRef,
        changelog: record.__changelog,
      };

      let newAnnotation;

      if (record._id) {
        const oldPart = await AnnotationPart.findById(record._id).exec();

        if (oldPart.parent) {
          if (upgradePartIdDict[oldPart.parent.toString()]) {
            newPartForm.parent = upgradePartIdDict[oldPart.parent.toString()];
          } else {
            console.error('unable to find new parent in dict')
          }
        }
        newPartForm._id = upgradePartIdDict[record._id];
        newAnnotation = await updatePart(oldPart, newPartForm);
      } else {
        newPartForm.history = [];
        newAnnotation = await AnnotationPart.create(newPartForm);
      };
      upgradedPartIds.add(newAnnotation._id.toString());
      newParts.push(newAnnotation._id);
    } else {
      newParts.push(record._id);
      // the sequenceRef hasn't change, but I don't think it does a matter (for now)
    }
  }

  // update all parents
  newParts = (await updateParents(newParts,upgradePartIdDict, upgradedPartIds)).map(v=>v._id);

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
  
  // build sequence if gff has sequence
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

  // calculate what part should be updated
  const upgradePartIdDict = {};
  const upgradedPartIds = new Set<string>();

  // traverse the records, set newId for every modified part
  for(const record of gffJson.records) {
    if (record.__modified && record._id) {
      upgradePartIdDict[record._id] = new mongoose.Types.ObjectId();
    }
  }

  // copy old features here if it's out of range
  let partsOnLeft = await AnnotationPart.find({
    _id:{$in:project.parts},
    start: {$lt: range.start},
    featureType: {$ne: 'unknown'},
  }).sort({start:1}).exec();

  let partsOnLeftIds = partsOnLeft.map(v=>v._id);

  let partsOnRight = await AnnotationPart.find({
    _id:{$in:project.parts},
    start: {$gte: range.start},
    end: {$gt: range.end},
    featureType: {$ne: 'unknown'}
  }).sort({start:1}).exec();

  let partsOnRightIds;

  const partsInMiddle = [];
  let partsInMiddleIds;
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
      const newPartForm:any = {
        ...record,
        original: false,
        createdAt: dateNow,
        updatedAt: dateNow,
        sequenceHash,
        sequenceRef: partSequenceRef,
        changelog: record.__changelog,
      };

      let newAnnotation;
      if (record._id) {
        const oldPart = await AnnotationPart.findById(record._id).exec();
        if (oldPart.parent) {
          if (upgradePartIdDict[oldPart.parent.toString()]) {
            newPartForm.parent = upgradePartIdDict[oldPart.parent.toString()];
          } else {
            console.error('unable to find new parent in dict')
          }
        }
        newPartForm._id = upgradePartIdDict[record._id];
        newAnnotation = await updatePart(oldPart, newPartForm);
      } else {
        newPartForm.history = [];
        newAnnotation = await AnnotationPart.create(newPartForm);
      }
      upgradedPartIds.add(newAnnotation._id.toString());
      partsInMiddle.push(newAnnotation._id);
    } else {
      partsInMiddle.push(record._id);
      // the sequenceRef hasn't change, but I don't think it does a matter (for now)
    }
  }

  partsInMiddleIds = partsInMiddle.map(v=>v._id);

  // if the length of gffJson = range, we don't change the parts on the right
  if( gffJson.mimetype === 'application/gffjson-head' ||
      gffJson.mimetype === 'application/gffjson' &&
      gffJson.seqInfo[gffJson.defaultChr].length === range.end - range.start
    ) {
    partsOnRightIds = partsOnRight.map(v=>v._id);
  } else {
    const offset =  gffJson.seqInfo[gffJson.defaultChr].length - (range.end - range.start);
    // shift all parts on the right
    partsOnRightIds = await Promise.all(partsOnRight.map(async (part)=>{
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

      upgradePartIdDict[part._id.toString()] = newAnnotation._id;
      upgradedPartIds.add(newAnnotation._id.toString());

      return newAnnotation._id;
    }));
  }

  // update parents of sub features
  newParts = [...partsOnLeftIds, ...partsInMiddleIds, ...partsOnRightIds];
  newParts = await updateParents(newParts, upgradePartIdDict, upgradedPartIds);

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

// /api/project/${id}/genbank
export const projectToGenbank = async (_id:string|mongoose.Types.ObjectId, selectedRange:IRange, clientToken:string) => {
  let gffJson;
  if (selectedRange!==undefined && selectedRange.start!==undefined && selectedRange.end!==undefined) {
    gffJson = await projectToGFFJSONPartial(_id, selectedRange);
  } else {
    gffJson = await projectToGFFJSON(_id);  
  }
  
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from(JSON.stringify(gffJson), 'utf-8'), 'project.gff.json');
    const result = await axios.post(`${conf.webexe.internalUrl}/api/fileParam/`,
      formData.getBuffer(),
      {
        headers: {
          ...formData.getHeaders(),
          'Cookie': `token=${clientToken}`,
        }
      });
    const gffJsonFilePath = result.data.filePath;
    // call webexe again to start mission
    const result2 = await axios.post(`${conf.webexe.internalUrl}/api/task/gffjson_to_genbank`,
    {
      params: {
        srcFileName:[gffJsonFilePath],
      },
      comments: {
        taskName: 'gff_to_genbank',
        _id,
        selectedRange,
      },
    },
    {
      headers: {
        'Cookie': `token=${clientToken}`,
      }
    });
    return {debugData: result.data, taskInfo: {...result2.data, serverURL: conf.webexe.url, processId: result2.data.processId},};
  } catch (err) {
    console.error(err);
  }
}