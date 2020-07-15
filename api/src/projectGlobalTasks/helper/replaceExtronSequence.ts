import { IAnnotationPartModel, AnnotationPart, IProjectModel } from "../../models";
import { updatePart, updateProject } from "../projectImportExport";
import mongoose from 'mongoose';
import rc from "./rc";
import getHash from './getHash';

// @sequenceBuffer: the sequence buffer which the modified sequence will be written to.
// newSequenceRefId: the seqeunceRefFileName, it may not exists yet, but will be created later.
export default async function replaceExtronSequence(project:IProjectModel, part:IAnnotationPartModel, sequence:string, sequenceBuffer:Buffer, newSequenceRefId:string, changelog:string) {
  
  const sequenceFoward = part.strand < 0 ? rc(sequence) : sequence;
  if (part.cdsRange && part.cdsRange.length > 0) {
    // write buffer to cds ranges
    let sequenceCount = 0;
    part.cdsRange.forEach(cds=>{
      let segment = sequenceFoward.substr(sequenceCount, cds.end-cds.start);
      if (part.strand == -1) {
        segment = rc(segment);
      }
      sequenceBuffer.write(segment, cds.start, 'ascii');    
      sequenceCount += segment.length;
    });
  } else {
    sequenceBuffer.write(sequenceFoward, part.start, 'ascii');
  }

  // now sequence has wrttten, update parts

  const replaceDict:any = {};

  const newPart = await updatePart(part, {
    sequenceHash: getHash(sequenceBuffer.toString('ascii', part.start, part.end), part.strand),
    sequenceRef: {fileName: newSequenceRefId, start: part.start, end: part.end, strand: part.strand},
    changelog,
  }, async (subFeatureId, map)=>{
    const newId = map[subFeatureId.toString()] || mongoose.Types.ObjectId();
    const part = await AnnotationPart.findOne({_id:subFeatureId}).exec();
    const parent = part.parent && map[part.parent] ? map[part.parent] : part.parent;
    const sequenceRef = {fileName: newSequenceRefId, start: part.start, end: part.end, strand: part.strand};
    const sequenceHash = getHash(sequenceBuffer.toString('ascii', part.start, part.end), part.strand);
    replaceDict[subFeatureId.toString()] = {_id:newId, name: part.name, start: part.start, changelog, parent};
    return updatePart(part, {_id:newId, parent, sequenceRef, sequenceHash, changelog});
  });

  replaceDict[part._id.toString()] = {_id:newPart._id, name: part.name, start: part.start, changelog, parent:part.parent};

  return replaceDict;
}