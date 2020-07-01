/// <reference path="../@types/index.d.ts" />
import {Project, AnnotationPart, ProjectLog} from '../models'
const mongoose = require('mongoose');

const createPromoterTerminator = async ({_id, 
  promoterLength=500, 
  terminatorLength=200, 
  selectedRange,
}: {_id:any, promoterLength:number, terminatorLength:number, selectedRange?:IRange}, 
onProgress?:(progress:number, message:string)=>void,
) => {
  if (onProgress) {onProgress(5, 'task started')}
  const exists = await Project.exists({_id,});
  console.log(_id, exists);
  if(! exists) throw new Error(JSON.stringify({status:404, message: 'unable to find project'}));

const project = await Project
.findById(_id)
.exec();

let partCondition:any = {
  _id:{$in:project.parts},
  featureType: 'gene',
};
if (selectedRange) {
  partCondition = {...partCondition, start:{$gte: selectedRange.start}, end:{$lt: selectedRange.end}}
}

const partsLen = await AnnotationPart.find(partCondition)
.count();

const parts = await AnnotationPart.find(partCondition)
.sort({start:1, end:-1})
.cursor();

const replaceMap = {};

const projectLog:IProjectLog = {
_id:undefined,
conflictParts: [] as IPartUpdateLog[],
modifiedParts: [] as IPartUpdateLog[],
createdParts: [] as IPartUpdateLog[],
deletedParts: [] as IPartUpdateLog[],
shiftedParts: [] as IPartUpdateLog[],
}
let partsCount=0;
let lastPercentage = 0;

let timeStamp = Date.now();
await parts.eachAsync(async (part)=>{
  partsCount++;
  if(onProgress) {
    const percentage = 5 + Math.floor(90 * partsCount/partsLen);
    const now = Date.now();
    // only send every second and every percentage.
    if(percentage >= lastPercentage + 1 && now - timeStamp >= 1000) {
      onProgress(percentage, `now doing ${partsCount}/${partsLen}`);
      lastPercentage = percentage;
      timeStamp = now;
    }
  }
  let proStart:number;
  let proEnd:number;
  let terStart:number;
  let terEnd:number;
  const proName = part.name + '_P';
  const terName = part.name + '_T';
  const now = new Date();
  if (part.strand === -1) {
    proStart = part.end;
    proEnd = part.end + promoterLength;
    if (proEnd > project.len) proEnd = project.len;
    terEnd = part.start;
    terStart = part.start - terminatorLength;
    if (terStart < 0) terStart = 0;
  } else {
    proStart = part.start - promoterLength;
    proEnd = part.start;
    if (proStart < 0) proStart = 0;
    terStart = part.end;
    terEnd = part.end + terminatorLength;
    if (terEnd > project.len) terEnd = project.len;
  }
  const promoter = await AnnotationPart.create({
    pid: mongoose.Types.ObjectId(),
    featureType: 'promoter',
    chrId: part.chrId,
    chrName: part.chrName,
    start: proStart,
    end: proEnd,
    len: proEnd-proStart,
    strand: part.strand,
    name: proName,
    original: false,
    history: [],
    sequenceRef: {
      fileName: part.sequenceRef.fileName, 
      start: proStart, 
      end: proEnd, 
      strand: part.strand
    },
    built: false,
    parent: null,
    attribute: {ID:proName},
    createdAt:now,
    updatedAt:now,
    changelog: `created ${promoterLength}bp promoter for ${part.name}`,
  });

  projectLog.createdParts.push({
    ctype: 'new',
    part: promoter._id,
    name: promoter.name,
    changelog: promoter.changelog,
    location: promoter.start,
    oldPart: null,
  });

  const terminator = await AnnotationPart.create({
    pid: mongoose.Types.ObjectId(),
    featureType: 'terminator',
    chrId: part.chrId,
    chrName: part.chrName,
    start: terStart,
    end: terEnd,
    len: terEnd-terStart,
    strand: part.strand,
    name: terName,
    original: false,
    history: [],
    sequenceRef: {
      fileName: part.sequenceRef.fileName, 
      start: terStart, 
      end: terEnd, 
      strand: part.strand
    },
    built: false,
    parent: null,
    attribute: {ID:terName},
    createdAt:now,
    updatedAt:now,
    changelog: `created ${terminatorLength}bp terminator for ${part.name}`,
  });

  projectLog.createdParts.push({
    ctype: 'new',
    part: terminator._id,
    name: terminator.name,
    changelog: terminator.changelog,
    location: terminator.start,
    oldPart: null,
  });

  replaceMap[part._id.toString()] = part.strand === -1 ? [terminator._id, part._id, promoter._id] : [promoter._id, part._id, terminator._id];
});

const newPartIds = [];
// project.parts.forEach(v=>newPartIds.push(v));

project.parts.forEach(v=>{
  const replaceTarget = replaceMap[v.toString()];
  if(replaceTarget) {
    replaceTarget.forEach(vv=>newPartIds.push(vv));    
  } else {
    newPartIds.push(v);
  }
});

onProgress(95, `saving history`);

const projectObj = project.toObject();
const history = [{
  _id: projectObj._id,
  updatedAt: projectObj.updatedAt,
  changelog: projectObj.changelog,
}, ...projectObj.history];
delete projectObj._id;
const projectForm = {...projectObj, 
  parts: newPartIds,
  changelog: 'created promoter and terminators',
  history, updatedAt: new Date()};
const newProject = await Project.create(projectForm);
if (project.ctype !== 'source') {
  await Project.updateOne({_id:project._id}, {ctype:'history'});
}

projectLog._id = newProject._id;
await ProjectLog.create(projectLog);

return newProject;
}

export default createPromoterTerminator;