import { IAnnotationPartModel, IProjectModel } from '../../models';
import { readSequenceFromSequenceBuffer } from '../../sequenceRef';

/**
 * get sequence but intron 
 * @param part: a feature object
 * @param sequenceBuffer: file content from the buffer files
*/

export default async function getExtronSequence(part:IAnnotationPartModel, sequenceBuffer:Buffer) {
  if (part.cdsRange && part.cdsRange.length > 0) {
    return (await Promise.all(part.cdsRange.map(range=>readSequenceFromSequenceBuffer(sequenceBuffer, range.start, range.end, part.strand)))).join('');
  } else {
    return await readSequenceFromSequenceBuffer(sequenceBuffer, part.start, part.end, part.strand);
  }
  
}