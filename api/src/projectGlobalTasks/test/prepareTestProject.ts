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


export async function prepareTestProject(obj?:any) {

  if(!obj) {
    obj = {
      name:"test",
      projectId:"5e999fc99b3fbc8a5a000000",
      version:"0.1",
      parts:[{
        featureType:"gene",
        chrName:"chr01",
        chrId:0,
        start:20,
        end:36,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741","Name":"YAL003W","orf_classification":"Verified","gene":"EFB1","Alias":"EFB1,EF-1beta,eEF1Balpha,TEF5","dbxref":"SGD:S000000003","Note":"test gene"},
        name:"test gene",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'ATGAAAGAAAAAATGA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"CDS",
        chrName:"chr01",
        chrId:0,
        start:20,
        end:26,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741_CDS","Name":"YAL003W"},
        name:"test gene cds",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'ATGAAA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"intron",
        chrName:"chr01",
        chrId:0,
        start:26,
        end:30,
        strand:1,
        attribute:{},
        name:"test intron",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'GAAA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"CDS",
        chrName:"chr01",
        chrId:0,
        start:30,
        end:36,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741_CDS","Name":"YAL003W"},
        name:"test gene intron",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'AAATGA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      len:60,
      history:[],
      sequenceHash:"ef1be857fb0cd00473aa11b60dea3430",
      sequence:'CCCCCCCCCCCCCCCCCCCCATGAAAGAAAAAATGACCCCCCCCCCCCCCCCCCCCCCCC',
      ctype:"source",
      changelog:"test project",
      createdAt: new Date(),
      updatedAt: new Date(),
      seqName:"chr01",
    }
  }

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
  try {
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
} catch (err) {
  console.error(err);
}

  
}