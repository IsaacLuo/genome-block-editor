/// <reference path="../@types/index.d.ts" />
import mongoose  from 'mongoose';
import conf from '../conf.json';
import { Project, AnnotationPart } from '../models';
const { parentPort } = require("worker_threads");

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectDb() {
  try {
    const mongooseState = mongoose.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      await mongoose.connect(
        conf.secret.mongoDB.url,
        {
          useNewUrlParser: true,
          // user: conf.secret.mongoDB.username,
          // pass: conf.secret.mongoDB.password, 
        }
      );
      break;
    }
  } catch(error) {
    throw('db connection error');
  }
}

async function main() {
  const exitPromise = new Promise((resolve)=>{
    // receive from main thread
    parentPort.on("message", async (messageObj) => {
      try {
        await connectDb();
        console.log('main thread send message', messageObj);
        const {type, data:id} = messageObj;
        if (type === 'startTask') {
          console.log(id);
          const project = await Project
            .findById(id)
            .populate({
              path:'parts', 
              match:{
                featureType: 'gene'
              },
              select:'_id',
              })
            .exec();
          const newObj = project.toObject();
          newObj.history = [newObj._id, ...newObj.history];
          newObj.parts = newObj.parts.map(v=>v._id);
          delete newObj.updatedAt;
          delete newObj._id;
          const newItem = await Project.create(newObj);
          parentPort.postMessage({type:'result', data: newItem._id.toString()});
          // old project become history
          await Project.update({_id:id}, {ctype:'history'})
        }
      } catch (err) {
        console.error(err);
        parentPort.postMessage({type:'error', data: err});
      }
      
      resolve();
    });
  })
  return exitPromise;
}

main().then(()=>{
  console.log('worker exit');
})