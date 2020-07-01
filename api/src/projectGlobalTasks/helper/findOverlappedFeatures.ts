import mongoose from 'mongoose';
import { AnnotationPart } from '../../models';
export default async function findOverlappedFeatures(partSelectCondition) {
  const conflictDict:any = {};
  const parts = await AnnotationPart.find(partSelectCondition)
  .select('_id start end')
  .sort({start:1, end:-1})
  .exec();
  const partsLen = parts.length;
  for (let i=0;i<partsLen;i++) {
    for(let j=i-1;j>=0;j--) {
      if(parts[j].end <= parts[i].start) break;
      else {
        if (!conflictDict[parts[i]._id.toString()]) conflictDict[parts[i]._id.toString()] = [parts[j]._id];
        else conflictDict[parts[i]._id.toString()].push(parts[j]._id);
        if (!conflictDict[parts[j]._id.toString()]) conflictDict[parts[j]._id.toString()] = [parts[i]._id];
        else conflictDict[parts[j]._id.toString()].push(parts[i]._id);
      }
    }
  }
  return conflictDict;
}