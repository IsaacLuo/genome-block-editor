import crypto from 'crypto';
import rc from './rc';
export default function getHash(sequence:string, strand: number) {
  let seq = strand < 0 ? rc(sequence) : sequence;
  return crypto.createHash('md5').update(seq).digest("hex");
}