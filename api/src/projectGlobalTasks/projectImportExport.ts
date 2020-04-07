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

const reverseDict = {a:'t', t:'a', c:'g', g:'c', A:'T', T:'A', C:'G', G:'C', n:'n', N:'N'};

export const reverseComplement = (seq:string) => {
  return Array.from(seq).reverse().map(v=>reverseDict[v]).join('');
}

export const readSequenceFromSequenceRef = async (sequenceRef: ISequenceRef) => {
  let sequence = await fs.promises.readFile(`public/sequences/${sequenceRef.fileName}`,{encoding:'utf-8'});
  if (sequenceRef.start || sequenceRef.end) {
    const start = sequenceRef.start || 0;
    const end = sequenceRef.end;
    sequence = sequence.substring(start,end);
  }
  if (sequenceRef.strand === -1) {
    sequence = reverseComplement(sequence);
  }
  return sequence;
}

export const projectToGFFJSON = async (_id:string|mongoose.Types.ObjectId)=>{
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

  const gffJson:IGFFJSON = {
    fileType: "cailab_gff_json",
    version: "0.1",
    seqInfo: {
      [project.name]: {length: project.len}
    },
    records: project.toObject().parts.map(part=>({...part, chrName: project.name})),
    sequence: {
      [project.name]: projectSequence
    }
  }

  return gffJson;
}

export const updateProjectByGFFJSON = async (project:IProjectModel, gffJson:IGFFJSON, progressCallBack?:(progress:number, message:string)=>{}  ) => {
  const newParts = [];

  // save sequence to file
  const sequenceRefStore = {};
  for (const sequenceName in gffJson.sequence) {
    const uuid = uuidv4();
    const seq = gffJson.sequence[sequenceName];
    fs.promises.writeFile(`public/sequences/${uuid}`, seq);
    sequenceRefStore[sequenceName] = {
      fileName: uuid,
      start: 0,
      end: seq.length,
      strand: 0,
    }
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
      const partSeq = gffJson.sequence[record.chrName].substring(record.start, record.end);
      let partSeqHash = crypto.createHash('md5').update(partSeq).digest("hex");
      const newPartTable = {
        history: [],
        ...record,
        original: false,
        createdAt: dateNow,
        updatedAt: dateNow,
        sequenceHash: partSeqHash,
        sequenceRef: {
          fileName: sequenceRefStore[record.chrName].fileName,
          start: record.start,
          end: record.end,
          strand: record.strand,
        },
      };

      // delete newPartTable.createdAt;
      // delete newPartTable.updatedAt;

      if (record._id) {
        const oldRecord = await AnnotationPart.findById(record._id).exec();
        newPartTable.history = [oldRecord._id, ...newPartTable.history];
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
  // create new project, save current one as history
  let newObj = project;
  if (project.constructor.name === 'model') {
    // object is mongoose object
    newObj = newObj.toObject();
  }
  newObj.history = [newObj._id, ...newObj.history];
  newObj.parts = newParts;
  delete newObj.updatedAt;
  delete newObj._id;
  const newItem = await Project.create(newObj);
  // old project become history
  await Project.update({_id:project._id}, {ctype:'history'});

  return newItem;
}



