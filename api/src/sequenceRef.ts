import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import conf from './conf';

const reverseDict = {a:'t', t:'a', c:'g', g:'c', A:'T', T:'A', C:'G', G:'C', n:'n', N:'N'};

export const reverseComplement = (seq:string) => {
  return Array.from(seq).reverse().map(v=>reverseDict[v]).join('');
}

export const readSequenceFromSequenceRef = async (sequenceRef: ISequenceRef, strand?:number) => {
  let sequence = await fs.promises.readFile(`${conf.rootStorageFolder}/sequences/${sequenceRef.fileName}`,{encoding:'utf-8'});
  if (sequenceRef.start || sequenceRef.end) {
    const start = sequenceRef.start || 0;
    const end = sequenceRef.end;
    sequence = sequence.substring(start,end);
  }
  if (strand === -1 || strand === undefined && sequenceRef.strand === -1) {
    sequence = reverseComplement(sequence);
  }
  return sequence;
}

export const generateSequenceRef = async (sequence:string, start?:number, end?:number, strand?:number) => {
  if (strand === -1 ) {
    sequence = reverseComplement(sequence);
  }
  const fileName = uuidv4();
  await fs.promises.writeFile(`${conf.rootStorageFolder}/sequences/${fileName}`, sequence);
  return {
    fileName,
    start: start || 0,
    end: end || sequence.length,
    strand: strand || 0,
  }
}