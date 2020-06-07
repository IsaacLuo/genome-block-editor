
import mongoose from 'mongoose';
import {AnnotationPart, Project} from '../models';
import connectMongoDB from '../mongodb';

async function main() {
  await connectMongoDB();
  let tm = Date.now();
  let project = await Project.findOne({_id:'5ed84caef9cfda384bd68013'}).exec();
  console.log(Date.now()-tm);
  const partIds = project.parts;
  tm = Date.now();
  await Project.findOne({_id:'5ed84caef9cfda384bd68013'}).populate('parts').exec();
  console.log(Date.now()-tm);

  tm = Date.now();
  let parts = await AnnotationPart.find({_id:{$in:partIds}}).exec();
  console.log(Date.now()-tm);

  tm = Date.now();
  for(const part of parts){
    await AnnotationPart.findOne({_id:part}).exec();
  }
  console.log(Date.now()-tm);

  // if (parts) {
    // const part = parts[0];
    // console.log(part.sequence);
  // }
  

  // console.log(part.sequence);
}

main().then(()=>process.exit());
// main();