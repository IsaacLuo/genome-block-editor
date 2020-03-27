import mongoose from 'mongoose';
import {Project} from '../models';
import { 
    saveProject, 
    deleteProject, 
    loadProjectStr, 
    saveProjectStr, 
    loadProjectIdStr,
    saveProjectIdStr,
} from '../redisCache';
import fs from 'fs';

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

  const gffJson = {
    fileType: "cailab_gff_json",
    version: "0.1",
    seqInfos: {
      [project.name]: {length: project.len}
    },
    records: project.toObject().parts.map(part=>({...part, chrName: project.name})),
    sequence: {
      [project.name]: projectSequence
    }
  }

  return gffJson;
}

export const hideProject = async (_id:string|mongoose.Types.ObjectId) => {
  await Project.update({_id}, {ctype:'deletedProject', updatedAt: new Date()});
  // save to redis
  deleteProject(_id.toString());
}

