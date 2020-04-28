/// <reference path="../@types/index.d.ts" />
import mongoose  from 'mongoose';
import conf from '../conf.json';
import { Project, AnnotationPart } from '../models';
import redis from 'redis'
import {promisify} from 'util';
import { loadProjectStr, saveProject, deleteProject } from '../redisCache';
// const { loadProjectStr, saveProject, deleteProject } = require('../redisCache');
const { parentPort } = require("worker_threads");

declare global {
  namespace NodeJS {
    interface Global {
      redisClient?: redis.RedisClient
    }
  }
}

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
  await connectDb();
  const usedIds = new Set();
  const isolatedIds = [];
  const cursor = Project.find().select('name parts').cursor();
  while(true) {
    const doc = await cursor.next();
    if (!doc) {
      break;
    }
    // put partIds into usedIds;
    console.log(doc.name);
    // const oldSize = usedIds.size;
    for(const part of doc.parts) {
      usedIds.add(part.toString());
    }
    // const addedSize = usedIds.size - oldSize;
    // console.log(addedSize, doc.parts.length);
  }
  console.log(`found ${usedIds.size} parts`)
  const cursor2 = AnnotationPart.find({original:false}).select('_id').cursor();
  while(true) {
    const part = await cursor2.next();
    if (!part) {
      break;
    }
    if (!usedIds.has(part._id)) {
      isolatedIds.push(part._id)
    }
  }
  console.log(`collected ${isolatedIds.length} isolated parts`);
  await AnnotationPart.deleteMany({_id:{$in:isolatedIds}});
  console.log('finish');
}

main().then(()=>{
  console.log('worker exit');
  process.exit();
})