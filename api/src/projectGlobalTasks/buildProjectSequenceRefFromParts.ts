import { Project, AnnotationPart } from '../models';
import { readSequenceFromSequenceRef } from '../sequenceRef';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import conf from '../conf';

export async function buildProjectSequenceRefFromParts(id:IProject) {
  const project = await Project
    .findById(id)
    .populate({
      path:'parts',
      })
    .exec();
  let sequenceArr:string[] = [];
  if(project.sequenceRef) {
    const sequence = await readSequenceFromSequenceRef(project.sequenceRef);
    sequenceArr = sequence.split('');
  }
  for (const part of project.parts) {
    const sequence = await readSequenceFromSequenceRef(part.sequenceRef, 1);
    for (let i = part.start; i < part.end; i++) {
      if (sequenceArr[i] === undefined) {
        sequenceArr[i] = sequence[i-part.start];
      } else if (sequenceArr[i].toUpperCase() !== sequence[i-part.start].toUpperCase()) {
        throw new Error(`conflict, pos ${i} not match`);
      } else {
        // overwrite, use the case of part sequence if different
        sequenceArr[i] = sequence[i-part.start];
      }
    }
  }

  // fill all unknown segment if exists
  for (let i=0;i<project.len;i++) {
    if(sequenceArr[i] === undefined) {
      sequenceArr[i] = 'N';
    }
  }

  const newObj = project.toObject();
  newObj.history = [{
    _id:newObj._id.toString(),
    changelog: newObj.changelog,
    updatedAt: newObj.updatedAt,
  }, ...newObj.history];
  newObj.parts = newObj.parts.map(v=>v._id);
  newObj.changelog = `built project sequence`;
  const fileName = uuidv4();
  await fs.promises.writeFile(`${conf.rootStorageFolder}/sequences/${fileName}`, sequenceArr.join(''));
  newObj.sequenceRef = {
    fileName,
    start: 0,
    end: project.len,
    strand: 0,
  }
  delete newObj.updatedAt;
  delete newObj._id;
  const newItem = await Project.create(newObj);
  return newItem;
}