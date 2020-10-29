import { AnnotationPart } from '../../models';

/**
 * find overlapped parts by search condition
 * @param partSelectCondition: mongodb search condition bocject e.g. {ctype:'gene', start:0, end:10000}
 * @return conflict dict, in format {part1_id: part2_id, part2_id: part1_id}
 */
export default async function findOverlappedFeatures(partSelectCondition) {
  const conflictDict:any = {};
  const parts = await AnnotationPart.find(partSelectCondition)
  .select('_id start end name')
  .sort({start:1, end:-1})
  .exec();
  const partsLen = parts.length;
  for (let i=0;i<partsLen;i++) {
    for(let j=i-1;j>=0;j--) {
      if(parts[j].end <= parts[i].start) break;
      else {
        if (!conflictDict[parts[i].id]) conflictDict[parts[i].id] = {part:parts[i].toObject(), targets:[parts[j].toObject()]};
        else conflictDict[parts[i].id].targets.push(parts[j].toObject());
        if (!conflictDict[parts[j].id]) conflictDict[parts[j].id] = {part:parts[j].toObject(), targets:[parts[i].toObject()]};
        else conflictDict[parts[j].id].targets.push(parts[i].toObject());
      }
    }
  }
  return conflictDict;
}