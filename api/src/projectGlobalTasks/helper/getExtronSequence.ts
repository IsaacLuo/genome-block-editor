import { IAnnotationPartModel, IProjectModel } from '../../models';
import { readSequenceFromSequenceBuffer } from '../../sequenceRef';
export default async function getExtronSequence(part:IAnnotationPartModel, sequenceBuffer:Buffer) {
  if (part.cdsRange && part.cdsRange.length > 0) {
    return (await Promise.all(part.cdsRange.map(range=>readSequenceFromSequenceBuffer(sequenceBuffer, range.start, range.end, part.strand)))).join('');
  } else {
    return await readSequenceFromSequenceBuffer(sequenceBuffer, part.start, part.end, part.strand);
  }

  // let dn = Date.now();
  // let cdses = await getCDSes(project, part);
  // console.log('get cds time=', Date.now() - dn);
  // dn = Date.now();
  // if (cdses && cdses.length>0) {
  //   // has cds, merge cds and return
  //   let sequence = (await Promise.all(cdses.map(cds=>readSequenceFromSequenceBuffer(sequenceBuffer, cds.start, cds.end, cds.strand)))).join('');
  //   console.log('get multi cds seq time=', Date.now() - dn,part.strand);
  //   return sequence;
  // } else {
  //   // no cds, return gene sequence
  //   let sequence = await readSequenceFromSequenceBuffer(sequenceBuffer, part.start, part.end, part.strand);
  //   console.log('get single seq time=', Date.now() - dn, part.strand);
  //   return sequence;
  // }
  
}