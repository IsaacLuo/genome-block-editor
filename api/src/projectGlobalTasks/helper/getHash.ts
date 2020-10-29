import crypto from 'crypto';
import rc from './rc';

/**
 * calcualte md5 for a sequence
 * @param sequence forward sequence
 * @param strand -1 for revserse sequence
 */
export default function getHash(sequence:string, strand: number) {
  let seq = strand < 0 ? rc(sequence) : sequence;
  return crypto.createHash('md5').update(seq).digest("hex");
}