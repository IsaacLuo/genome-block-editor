/// <reference path="../@types/index.d.ts" />
import mongoose  from 'mongoose';
import conf from '../conf.json';
import { Project, AnnotationPart } from '../models';
import redis from 'redis'
import {promisify} from 'util';
import { loadProjectStr, saveProject, deleteProject } from '../redisCache';
import fs from 'fs';
// const { loadProjectStr, saveProject, deleteProject } = require('../redisCache');
const { parentPort } = require("worker_threads");
const fs_exists = promisify(fs.exists);

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

  console.log('fetching new projects')

  const projects = await Project.find({ctype:{$in:['source', 'project', 'flatProject']}}).select('_id ctype').exec();
  const projectLength = projects.length;
  let i=0;
  for(const project of projects) {
    i++;
    let cacheFileName = `./${conf.rootStorageFolder}/sourceFileCaches/${project._id}`;
    cacheFileName+='.'
    cacheFileName+=project.ctype;

    console.log(cacheFileName);
    if(await fs_exists(cacheFileName)) {
      console.log(`${cacheFileName} exists`);
    } else {
    const result = await Project.findById(project._id)
      .populate({
        path:'parts',
      })
      .exec();
    await fs.promises.writeFile(cacheFileName, JSON.stringify(result));
    }
    console.log(`${i}/${projectLength}`);
  }
  console.log('finish preloading');
}

main().then(()=>{
  console.log('worker exit');
  process.exit();
})