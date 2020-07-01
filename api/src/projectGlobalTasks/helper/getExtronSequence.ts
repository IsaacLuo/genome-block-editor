import { AnnotationPart, IAnnotationPartModel, IProjectModel } from '../../models';
import { readSequenceFromSequenceRef } from '../../sequenceRef';
import getCDSes from './getPartCDSes';
export default async function getExtronSequence(project:IProjectModel, part:IAnnotationPartModel) {
  let cdses = await getCDSes(project, part);
  if (cdses) {
    // has cds, merge cds and return
    let sequence = (await Promise.all(cdses.map(cds=>readSequenceFromSequenceRef(cds.sequenceRef)))).join('');
    return sequence;
  } else {
    // no cds, return gene sequence
    let sequence = await readSequenceFromSequenceRef(part.sequenceRef);
    return sequence;
  }

  // const introns = await AnnotationPart.find({
  //   _id:{$in:allSubFeatures}, 
  //   featureType:{$in:['intron', 'five_prime_UTR_intron']},
  // }).exec();

  // let sequence = await readSequenceFromSequenceRef(part.sequenceRef);
  // if(introns) {
  //   // delete intron's sequence;
  //   const arr = sequence.split('');
  //   introns.forEach(intron=>{
  //     for (let i=intron.start - part.start; i< intron.end - part.start; i++) {
  //       arr[i] = undefined;
  //     }
  //   })
  //   sequence = arr.filter(v=>v!==undefined).join('');
  //   return sequence;
  // } else {
  //   // no introns, use part's sequence
  //   return sequence;
  // }
}