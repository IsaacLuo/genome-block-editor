/// <reference path="../@types/index.d.ts" />
import conf from '../conf.json';
const { parentPort } = require("worker_threads");
const mongooseWorker = require('mongoose');

async function connectDb() {
  try {
    let mongoURL = conf.secret.mongoDB.url;
    const mongooseState = mongooseWorker.connection.readyState;
    switch (mongooseState) {
      case 3:
      case 0:
      await mongooseWorker.connect(
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

export default async function taskWorker(taskFunc:(data:any, callback:(progress:number, message:string)=>void)=>Promise<any>) {
  const exitPromise = new Promise((resolve)=>{
    // receive from main thread
    parentPort.on("message", async (messageObj) => {
      try {
        // console.log('main thread send message', messageObj);
        const {type, data} = messageObj;
        if (type === 'startTask') {
          await connectDb();
          const newItem = await taskFunc(data, (progress, message)=>{
            parentPort.postMessage({type:'progress', data:{progress, message}});
          });
          parentPort.postMessage({type:'result', data: {newProjectId:newItem._id.toString()}});
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