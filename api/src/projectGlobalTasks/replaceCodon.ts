/// <reference path="../@types/index.d.ts" />
import {Project, AnnotationPart, ProjectLog} from '../models'
import findOverlappedFeatures from './helper/findOverlappedFeatures';
import getExtronSequence from './helper/getExtronSequence';
import replaceExtronSequence from './helper/replaceExtronSequence';
import { updateProject } from './projectImportExport';
const mongoose = require('mongoose');

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
  let lastPercentage = 0;

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

  await AnnotationPart.find(partCondition)
  .sort({start:1, end:-1})
  .cursor()
  .eachAsync(async (part)=>{
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

    const extronSequence = await getExtronSequence(project, part);
    
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
    

    if(modified) {
      newExtronSequence = newExtronSequence.join('');
      replaceDict = {...replaceDict, ...(await replaceExtronSequence(project, part, newExtronSequence, `replaced codons ${rules.join(' ')}`))};
    }
  });

  // update project

  if(onProgress) onProgress(95, `saving history`);

  const newParts = project.parts.map(part=>{
    if(replaceDict[part.toString()]) {
      const target = replaceDict[part.toString()];

      projectLog.modifiedParts.push({
        ctype: 'modified',
        part: replaceDict[part.toString()]._id,
        name: target.name,
        changelog: target.changelog,
        location: target.start,
        oldPart: part,
      });
      return target._id;
    } else {
      return part;
    }
  });
  const newProject = await updateProject(project, {parts: newParts, changelog:`replaced codons ${rules.join(' ')}`});
  projectLog._id = newProject._id;
  await ProjectLog.create(projectLog);
  return newProject;
}

export default replaceCodon;