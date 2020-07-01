import { IAnnotationPartModel, AnnotationPart, IProjectModel } from "../../models";
import getCDSes from "./getPartCDSes";
import { generateSequenceRef, readSequenceFromSequenceRef } from "../../sequenceRef";
import { updatePart, updateProject } from "../projectImportExport";

function rc(seq:string) {
    const dict = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'};
    return seq.split('').map(v=>dict[v]).reverse().join('');
}

export default async function replaceExtronSequence(project:IProjectModel, part:IAnnotationPartModel, sequence:string, changelog:string) {
  let cdses = await getCDSes(project, part);
  if (cdses) {
    const cdsLen = cdses.reduce((pre, cur)=>pre+cur.len, 0);
    if (sequence.length !== cdsLen) {
      throw new Error(`sequence not in same length ${cdsLen} => ${sequence.length}`);
    };

    let wholeSequence = await readSequenceFromSequenceRef(project.sequenceRef);

    let sequenceCount = 0;
    cdses.forEach(cds=>{
      let segment = sequence.substr(sequenceCount, cds.len);
      if (cds.strand == -1) {
        segment = rc(segment);
      }
      wholeSequence = wholeSequence.substring(0, cds.start) + segment + wholeSequence.substring(cds.end);
      sequenceCount += segment.length;
    });

    const newSequenceRef = await generateSequenceRef(wholeSequence);

    const replaceDict = {};

    const now = new Date();
    const updatePartSequence = async (part) => {

      if(replaceDict[part._id.toString()]) {
        return replaceDict[part._id.toString()]._id;
      }

      const newPartForm:any = {
        _id: undefined,
        sequenceRef: {fileName: newSequenceRef.fileName, start: part.start, end: part.end, strand: part.strand},
        createdAt: now,
        updatedAt: now,
        changelog,
      }

      if (part.parent) {
        if (replaceDict[part.parent]) {
          newPartForm.parent = replaceDict[part.parent]._id;
        } else {
          const parent = await AnnotationPart.findOne({_id:part.parent}).exec();
          newPartForm.parent = await updatePartSequence(parent);
        }
      }

      const newPart = await updatePart(part, newPartForm);
      replaceDict[part._id.toString()] = newPart;
      return newPart._id;
    };

    for(const cds of cdses) {
      await updatePartSequence(cds);
    }

    return replaceDict;
  }
}