
import mongoose from 'mongoose';
import {AnnotationPart} from '../models';
import connectMongoDB from '../mongodb';

async function main() {
  await connectMongoDB();
  let parts = await AnnotationPart.find({}).exec();
  if (parts) {
    const part = parts[0];
    console.log(part.sequence);
  }
  

  // console.log(part.sequence);
}

main().then(()=>process.exit());
// main();