/// <reference path="../@types/index.d.ts" />
import mongoose  from 'mongoose';
import conf from '../conf.json';
import { Project, AnnotationPart } from '../models';
import { buildProjectSequenceRefFromParts } from './buildProjectSequenceRefFromParts';
const { parentPort } = require("worker_threads");

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let mongoURL = conf.secret.mongoDB.url;

async function connectDb() {
  try {
    const mongooseState = mongoose.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      await mongoose.connect(
        mongoURL,
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
        // console.log('main thread send message', messageObj);
        const {type, data:id} = messageObj;
        if (type === 'startTask') {
          await connectDb();
          const newItem = await buildProjectSequenceRefFromParts(id);
          parentPort.postMessage({type:'result', data: newItem._id.toString()});
          // old project become history
          await Project.update({_id:id}, {ctype:'history'})
        } else if (type === 'setMongoURL') {
          mongoURL = messageObj.data;
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