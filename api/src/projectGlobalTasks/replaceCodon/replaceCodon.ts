/// <reference path="../@types/index.d.ts" />
import {Project, AnnotationPart, ProjectLog} from '../models'
import findOverlappedFeatures from './helper/findOverlappedFeatures';
import getExtronSequence from './helper/getExtronSequence';
import replaceExtronSequence from './helper/replaceExtronSequence';
import { updateProject } from './projectImportExport';
import { readSequenceFromSequenceRef, readSequenceBufferFromSequenceRef, generateSequenceRef, generateSequenceFilePath } from '../sequenceRef';
import { v1 as uuidv1 } from 'uuid';
import fs from 'fs';
const mongoose = require('mongoose');


// change sequence: yes
// shift parts: no

const replaceCodon = async ({_id, 
  rules=[],
  selectedRange,
}: {_id:any, rules:string[], selectedRange?:IRange}, 
onProgress?:(progress:number, message:string)=>void,
) => {
  if (onProgress) {onProgress(5, 'task started')}
  const exists = await Project.exists({_id,})
  console.log(_id, exists);
  if(! exists) throw new Error(JSON.stringify({status:404, message: 'unable to find project'}));

  const project = await Project
  .findById(_id)
  .exec();

  const projectLog:IProjectLog = {
  _id:undefined,
  conflictParts: [] as IPartUpdateLog[],
  modifiedParts: [] as IPartUpdateLog[],
  createdParts: [] as IPartUpdateLog[],
  deletedParts: [] as IPartUpdateLog[],
  shiftedParts: [] as IPartUpdateLog[],
  }
  let partsCount=0;

  let timeStamp = Date.now();

  // filter overlapping genes
  const conflictDict = await findOverlappedFeatures({
    _id:{$in:project.parts},
    parent: null,
    start: selectedRange ? {$gte: selectedRange.start}: undefined,
    end: selectedRange ? {$lt: selectedRange.end}: undefined,
  });

  let partCondition:any = {
    _id:{$in:project.parts},
    featureType: 'gene',
  };
  if (selectedRange) {
    partCondition = {...partCondition, start:{$gte: selectedRange.start}, end:{$lt: selectedRange.end}}
  }
  const partsLen = await AnnotationPart.find(partCondition)
  .count();

  let replaceDict:any = {};

  // get project sequence;
  // let projectSequence = Buffer.from(await readSequenceFromSequenceRef(project.sequenceRef), 'ascii');
  let projectSequenceBuf = await readSequenceBufferFromSequenceRef(project.sequenceRef);
  let newSequenceReferenceFileName = uuidv1();

  // apply changes to each part
  await AnnotationPart.find(partCondition)
  .sort({start:1, end:-1})
  .cursor()
  .eachAsync(async (part)=>{
    let tg;
    // tg = Date.now();
    partsCount++;
    // console.debug(partsCount);
    if(onProgress) {
      const percentage = 5 + Math.floor(90 * partsCount/partsLen);
      const now = Date.now();
      // only send every second and every percentage.
      if(now - timeStamp >= 1000) {
        onProgress(percentage, `now doing ${partsCount}/${partsLen}`);
        timeStamp = now;
      }
    }

    // make sure it's not overlapping other top level features
    if (conflictDict[part._id.toString()]) {
      const otherFeatureNames = (await AnnotationPart.find({_id:{$in:conflictDict[part._id.toString()]}}).select('name').exec()).map(v=>v.name);
      projectLog.conflictParts.push({
        ctype: 'conflict',
        part: part._id,
        name: part.name,
        changelog: `conflict with ${otherFeatureNames.join(', ')}`,
        location: part.start,
      })
      return;
    }
    // console.debug(`before extron time =${Date.now()-tg}`)
    // tg = Date.now();
    const extronSequence = await getExtronSequence(part, projectSequenceBuf);
    // console.debug(`get extron time =${Date.now()-tg} ${part.strand}`)
    // tg = Date.now();
    const rulesDict:any = {};
    rules.forEach(ruleStr=>{
      const [src, dst] = ruleStr.toUpperCase().split(':');
      rulesDict[src] = dst;
    })

    let newExtronSequence:any = [];
    let modified = false;
    for(let i=0;i<extronSequence.length;i+=3) {
      const codon = extronSequence.substr(i, 3).toUpperCase();
      if (rulesDict[codon]) {
        newExtronSequence.push(rulesDict[codon]);
        modified = true;
      } else {
        newExtronSequence.push(codon);
      }
    }
    // console.debug(`apply rules time =${Date.now()-tg}`)
    tg = Date.now();
    if(modified) {
      newExtronSequence = newExtronSequence.join('');
      const subReplaceDict = await replaceExtronSequence(project, part, newExtronSequence, projectSequenceBuf, newSequenceReferenceFileName, `replaced codons ${rules.join(' ')}`);
      replaceDict = {
        ...replaceDict, 
        ...subReplaceDict, 
      };
    }
    // console.debug(`replace time =${Date.now()-tg}`)
  });

  // now the sequence is updated, write to file

  fs.promises.writeFile(generateSequenceFilePath(newSequenceReferenceFileName), projectSequenceBuf);

  // update project

  if(onProgress) onProgress(95, `saving history`);
  const newParts = project.parts.map(part=>{
    if(replaceDict[part.toString()]) {
      const target = replaceDict[part.toString()];

      if (!target.parent) {
        projectLog.modifiedParts.push({
          ctype: 'modified',
          part: replaceDict[part.toString()]._id,
          name: target.name,
          changelog: target.changelog,
          location: target.start,
          oldPart: part,
        });
      }
      return target._id;
    } else {
      return part;
    }
  });
  const newSequenceRef:ISequenceRef = {fileName: newSequenceReferenceFileName, start:0, end: project.len, strand:0};
  const newProject = await updateProject(project, {parts: newParts, sequenceRef: newSequenceRef, changelog:`replaced codons ${rules.join(' ')}`});
  projectLog._id = newProject._id;
  await ProjectLog.create(projectLog);
  if (onProgress) onProgress(100, `project saved`);
  return newProject;
}

export default replaceCodon;