/// <reference path="../@types/index.d.ts" />
import {Project, AnnotationPart, ProjectLog} from '../models'
import findOverlappedFeatures from './helper/findOverlappedFeatures';
import getExtronSequence from './helper/getExtronSequence';
import replaceExtronSequence from './helper/replaceExtronSequence';
import { updateProject, updatePart } from './projectImportExport';
import { readSequenceFromSequenceRef, readSequenceBufferFromSequenceRef, generateSequenceRef, generateSequenceFilePath } from '../sequenceRef';
import { v1 as uuidv1 } from 'uuid';
import fs from 'fs';
import getHash from './helper/getHash';
import { argsToArgsConfig } from 'graphql/type/definition';
const mongoose = require('mongoose');


// change parts: yes
// change sequence: yes
// shift parts: yes

const removeIntron = async ({_id, 
  intronTypes=['intron', 'five_prime_UTR_intron'],
  selectedRange,
}: {_id:any, intronTypes:string[], selectedRange?:IRange}, 
onProgress?:(progress:number, message:string)=>void,
) => {

  if (onProgress) {onProgress(1, 'task started')}
  const exists = await Project.exists({_id,})
  if(! exists) throw new Error(JSON.stringify({status:404, message: 'unable to find project'}));

  const project = await Project
  .findById(_id)
  .exec();

  if (selectedRange === undefined) {
    selectedRange = {start: 0, end: project.len};
  }

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
  if(onProgress) onProgress(2, `finding overlapped features`);
  const conflictDict = await findOverlappedFeatures({
    _id:{$in:project.parts},
    parent: null,
    start: {$gte: selectedRange.start},
    end: {$lt: selectedRange.end}
  });
  
  let replaceDict:IPartReplaceDict = {};

  // get project sequence;
  let projectSequenceBuf = await readSequenceBufferFromSequenceRef(project.sequenceRef);
  let newSequenceReferenceFileName = uuidv1();



  let ignoreFeaturesIds = [];
  await AnnotationPart
  .find({
    _id:{$in: Object.keys(conflictDict)},
    start:{$gte: selectedRange.start}, 
    end:{$lt: selectedRange.end},
  })
  .select('_id subFeatures')
  .sort({start:1, end:-1})
  .cursor()
  .eachAsync(async (part)=>{
    ignoreFeaturesIds.push(part.id);
    if (part.subFeatures) ignoreFeaturesIds.push(...part.subFeatures);
  });

  // find all introns
  if(onProgress) onProgress(3, `locating introns`);

  const allIntrons = await AnnotationPart
  .find({
    _id:{$in: project.parts}, 
    featureType: {$in:intronTypes},
    start:{$gte: selectedRange.start}, 
    end:{$lt: selectedRange.end},
  })
  .select('_id')
  .sort({start:1, end:-1})
  .exec();

  const allIntronIds = allIntrons.map(v=>v._id);

  const introns = await AnnotationPart
    .find({
      $and:[
        {_id:{$in: allIntronIds}}, 
        {_id:{$nin: ignoreFeaturesIds}},
      ]
    })
    .select('_id start end name')
    .sort({start:1, end:-1})
    .exec();
  const intronIds = introns.map(v=>v._id);
  const partToBeDeleted = new Set(intronIds.map(v=>v.toString()));
  projectLog.deletedParts = introns.map(part=>({
    ctype: 'deleted',
    part: part._id,
    partPid: part.pid,
    name: part.name,
    changelog: `deleted by removing intron`,
    location: null,
    oldLocation: part.start,
  }))

  // create shiftRuler
  const shiftRuler:Array<{start:number, end:number, offset?:number, matchStart?:boolean}> = [];
  {
    let lastMark = 0;
    let offset = 0;
    for (let i=0;i<introns.length;i++) {
      shiftRuler.push({start:lastMark, end: introns[i].start, offset,});
      shiftRuler.push({start:introns[i].start, end: introns[i].end, offset, matchStart:true});
      lastMark = introns[i].end;
      offset -= (introns[i].end - introns[i].start);
    }
    shiftRuler.push({start:lastMark, end: project.len + 1, offset,});
  }

  // calculate ignored genes
  let partCondition:any = {
    _id:{$in:Object.keys(conflictDict)},  
    featureType:'gene',
    subFeatures:{$elemMatch: {$in:allIntronIds}},
    start:{$gte: selectedRange.start}, 
    end:{$lt: selectedRange.end},
  };

  await AnnotationPart.find(partCondition)
  .sort({start:1, end:-1})
  .cursor()
  .eachAsync(async (part)=>{
    let ruler = shiftRuler.find(v=>part.start >= v.start && part.start < v.end);
    const start = ruler.matchStart!==true ? part.start + ruler.offset : ruler.start + ruler.offset;
    projectLog.conflictParts.push({
      ctype: 'conflict',
      part: conflictDict[part.id].part._id,
      partPid: conflictDict[part.id].part.pid,
      name: conflictDict[part.id].part.name,
      changelog: `conflict with ${conflictDict[part.id].targets.map(v=>v.name).join(', ')}`,
      location: start,
      oldLocation: part.start,
    })
  });
  
  // find all parts contains these introns
  partCondition = {
    $and:[
      {_id:{$in:project.parts}},
      {_id:{$nin:Object.keys(conflictDict)}},
    ],
    // featureType:'gene',
    parent: null,
    subFeatures:{$elemMatch: {$in:intronIds}},
    start:{$gte: selectedRange.start}, 
    end:{$lt: selectedRange.end},
  };
  let partsLen = await AnnotationPart.find(partCondition)
  .count();

  // const alreadyModifiedFeatures = [];
  
  // for all genes in range
  partsCount = 0;
  await AnnotationPart.find(partCondition)
  .sort({start:1, end:-1})
  .cursor()
  .eachAsync(async (part)=>{
    partsCount++;
    if(onProgress) {
      const percentage = 5 + Math.floor(65 * partsCount/partsLen);
      const now = Date.now();
      // only send every second
      if(now - timeStamp >= 1000) {
        onProgress(percentage, `now moving ${partsCount}/${partsLen}`);
        timeStamp = now;
      }
    }

    // make sure it's not overlapping other top level features
    if (conflictDict[part.id]) {
      return;
    }

    let modified = false;
    // remove intron
    let newProjectLen = project.len;
    introns.filter(v=>part.subFeatures.find(sf=>v._id.equals(sf))).forEach(intron=>{
      modified = true;
      const intronLen = intron.end-intron.start;
      newProjectLen -= intronLen;
      // write space into the buffer, will be removed later
      projectSequenceBuf.write(new Array(intronLen + 1).join(' '), intron.start, 'ascii');
    });

    if(modified) {
      // update main Features
      const oldLocation = part.start;
      let ruler = shiftRuler.find(v=>part.start >= v.start && part.start < v.end);
      const start = ruler.matchStart!==true ? part.start + ruler.offset : ruler.start + ruler.offset;
      ruler = shiftRuler.find(v=>part.end >= v.start && part.end < v.end);
      const end = ruler.matchStart!==true ? part.end + ruler.offset : ruler.start + ruler.offset;
      const changelog = `deleted introns`;
      const sequenceRef = {fileName: newSequenceReferenceFileName, start, end, strand: part.strand};      
      const sequenceHash = getHash(projectSequenceBuf.toString('ascii', part.start, part.end).replace(/ /g, ''), part.strand);
      const newPart = await updatePart(part, {start, end, changelog, sequenceRef, sequenceHash}, async (subFeatureId, map)=>{
        if (partToBeDeleted.has(subFeatureId.toString())) {
          return null;
        }
        // return subFeatureId as any;
        const newId = map[subFeatureId.toString()] || mongoose.Types.ObjectId();
        const part = await AnnotationPart.findOne({_id:subFeatureId}).exec();
        const parent = part.parent && map[part.parent] ? map[part.parent] : part.parent;
        const sequenceHash = getHash(projectSequenceBuf.toString('ascii', part.start, part.end).replace(/ /g, ''), part.strand);
        let ruler = shiftRuler.find(v=>part.start >= v.start && part.start < v.end);
        const start = ruler.matchStart!==true ? part.start + ruler.offset : ruler.start + ruler.offset;
        ruler = shiftRuler.find(v=>part.end >= v.start && part.end < v.end);
        const end = ruler.matchStart!==true ? part.end + ruler.offset : ruler.start + ruler.offset;
        const sequenceRef = {fileName: newSequenceReferenceFileName, start, end, strand: part.strand};
        replaceDict[subFeatureId.toString()] = {_id:newId, name: part.name, start, changelog, parent, oldStart:part.start};
        // alreadyModifiedFeatures.push(subFeatureId);
        return updatePart(part, {_id:newId, start, end, parent, sequenceRef, sequenceHash, changelog});
      });
      replaceDict[part._id.toString()] = {_id:newPart._id, name: part.name, start, changelog, oldStart: oldLocation};
      projectLog.modifiedParts.push({
        ctype: 'modified',
        part: part._id,
        partPid: part.pid,
        name: part.name,
        changelog,
        location: start,
        oldLocation,
      });
      // alreadyModifiedFeatures.push(part._id);
    }
    // console.debug(`replace time =${Date.now()-tg}`)
  });
  // shift other Features
  partCondition = {
    _id:{$in:project.parts},
    // featureType:{$nin:intronTypes},
    start:{$gte: selectedRange.start},
    parent:null,
  }
  partsLen = await AnnotationPart.find(partCondition)
  .count();
  await AnnotationPart.find(partCondition)
  .sort({start:1, end:-1})
  .cursor()
  .eachAsync(async (part)=>{
    partsCount++;
    if(onProgress) {
      const percentage = 70 + Math.floor(25 * partsCount/partsLen);
      const now = Date.now();
      // only send every second
      if(now - timeStamp >= 1000) {
        onProgress(percentage, `now doing ${partsCount}/${partsLen}`);
        timeStamp = now;
      }
    }

    if(partToBeDeleted.has(part._id.toString()) || replaceDict[part._id.toString()]) {
      // newProjectParts.push(replaceDict[part._id.toString()]._id);
      console.log(`part ${part.name} already changed`)
    } else {
      const oldLocation = part.start;
      let ruler = shiftRuler.find(v=>part.start >= v.start && part.start < v.end);
      const start = ruler.matchStart!==true ? part.start + ruler.offset : ruler.start + ruler.offset;
      ruler = shiftRuler.find(v=>part.end >= v.start && part.end < v.end);
      const end = ruler.matchStart!==true ? part.end + ruler.offset : ruler.start + ruler.offset;
      if (start !== part.start || end !== part.end) {
        const changelog = `shifted ${ruler.offset}bp by removing introns`;
        const sequenceRef = {fileName: newSequenceReferenceFileName, start, end, strand: part.strand};

        const newPart = await updatePart(part, {start, end, changelog, sequenceRef}, async (subFeatureId, map)=>{
          if (partToBeDeleted.has(subFeatureId.toString())) {
            return null;
          }
          const newId = map[subFeatureId.toString()] || mongoose.Types.ObjectId();
          const part = await AnnotationPart.findOne({_id:subFeatureId}).exec();
          const parent = part.parent && map[part.parent] ? map[part.parent] : part.parent;
          let ruler = shiftRuler.find(v=>part.start >= v.start && part.start < v.end);
          const start = ruler.matchStart!==true ? part.start + ruler.offset : ruler.start + ruler.offset;
          ruler = shiftRuler.find(v=>part.end >= v.start && part.end < v.end);
          const end = ruler.matchStart!==true ? part.end + ruler.offset : ruler.start + ruler.offset;
          const sequenceRef = {fileName: newSequenceReferenceFileName, start, end, strand: part.strand};
          replaceDict[subFeatureId.toString()] = {_id:newId, name: part.name, start, changelog, parent};
          return updatePart(part, {_id:newId, start, end, parent, sequenceRef, changelog});
        });
        replaceDict[part._id.toString()] = {_id:newPart._id, name: part.name, start, changelog, };
        projectLog.shiftedParts.push({
          ctype: 'shifted',
          part: part._id,
          partPid: part.pid,
          name: part.name,
          changelog,
          location: start,
          oldLocation,
        });
      }
  }
  });

  //write back to buffer
  let writeP = 0;
  for(let i=0;i<project.len;i+=1000) {
    let slice = projectSequenceBuf.slice(i, i+1000);
    let sliceString = slice.toString().replace(/ /g, '');
    projectSequenceBuf.write(sliceString, writeP, 'ascii');
    writeP += sliceString.length;
  }


  // now the sequence is updated, write to file

  fs.promises.writeFile(generateSequenceFilePath(newSequenceReferenceFileName), projectSequenceBuf);

  // update project

  if(onProgress) onProgress(95, `saving history`);
  const newParts = project.parts.map(part=>{
    if(replaceDict[part.toString()]) {
      const target = replaceDict[part.toString()];
      if (!target.parent) {
        const newPart = replaceDict[part.toString()];
        projectLog.modifiedParts.push({
          ctype: 'modified',
          part: newPart._id,
          partPid: newPart.pid,
          name: target.name,
          changelog: target.changelog,
          location: target.start,
          oldLocation: newPart.oldLocation,
          oldPart: part,
        });
      }
      return target._id;
    } else if (partToBeDeleted.has(part.toString())) {
      return null;
    } else {
      return part;
    }
  }).filter(v=>v!==null);
  const newSequenceRef:ISequenceRef = {fileName: newSequenceReferenceFileName, start:0, end: project.len, strand:0};
  const newProject = await updateProject(project, {parts: newParts, sequenceRef: newSequenceRef, changelog:`removed introns ${intronTypes.join(', ')}`});
  projectLog._id = newProject._id;
  await ProjectLog.create(projectLog);
  if (onProgress) onProgress(100, `project saved`);
  return newProject;
}

export default removeIntron;