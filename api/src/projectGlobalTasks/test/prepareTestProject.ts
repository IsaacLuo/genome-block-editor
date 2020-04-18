import { Project, AnnotationPart } from "../../models";
import { v4 as uuidv4 } from 'uuid';

const seqRef = require("../../sequenceRef");

const memStorage = {

}

export const mock_generateSequenceRef = jest.fn((sequence, start, end, strand)=>{
  const fileName = uuidv4();
  if (strand === -1) {
    sequence = seqRef.reverseComplement(sequence);
  }
  memStorage[fileName] = {
    idx: {
      fileName,
      start,
      end,
      strand,
    },
    sequence,
  };
  return memStorage[fileName].idx;
})

export const mock_readSequenceFromSequenceRef = jest.fn((sequenceRef: ISequenceRef, strand?:number)=>{
  const item = memStorage[sequenceRef.fileName];
  if (item) {
    let sequence = (item.sequence as string).substring(sequenceRef.start, sequenceRef.end);
    if(strand === -1 || strand === undefined && item.idx.strand === -1) {
      sequence = seqRef.reverseComplement(sequence);
    }
    return sequence;
  } else {
    return '';
  }
})


export async function prepareTestProject(obj:any) {
  const {
    projectId,
    ctype,
    name,
    version,
    parts,
    owner,
    group,
    permission,
    createdAt,
    updatedAt,
    changelog,
    history,
    len,
    sequence,
  } = obj;
  const partIds = [];
  for (const part of parts) {
    const {
      featureType,
      chrId,
      chrName,
      start,
      end,
      strand,
      name,
      original,
      history,
      sequenceHash,
      createdAt,
      updatedAt,
      changelog,
      sequence,
    } = part;
    let sequenceRef = undefined;
    if (sequence) {
      sequenceRef = await mock_generateSequenceRef(sequence, 0, sequence.length, strand);
    }
    const savedPart = await AnnotationPart.create({
      featureType,
      chrId,
      chrName,
      start,
      end,
      strand,
      name,
      original,
      history,
      sequenceHash,
      createdAt,
      updatedAt,
      changelog,
      sequenceRef,
    });
    partIds.push(savedPart._id);
  }
  let sequenceRef = undefined;
  if (sequence) {
    sequenceRef = await mock_generateSequenceRef(sequence, 0, len, 0);
  }
  const project = await Project.create({
    projectId,
    ctype,
    name,
    version,
    parts: partIds,
    owner,
    group,
    permission,
    createdAt,
    updatedAt,
    changelog,
    history,
    len,
    sequenceRef,
  });

  return project;
}