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

async function getMemUsage(redisClient) {
  const clientInfo = await promisify(redisClient.info).bind(redisClient)();
  let re:number = 0;
  const lines = clientInfo.split("\n");
  for(const line of lines) {
    if (line.match(/^(used_memory):/)) {
      re = parseInt(line.split(":")[1]);
    } else if (line.match(/^(used_memory_human):/)) {
      console.log(new Date().toLocaleTimeString(), line.split(":")[1])
    }
  }
  return re;
}

async function main() {
  if (!conf.redis.useRedis) {
    return;
  }

  if (!conf.redis.prefetchMaxSize) {
    console.log(`skip prefetch`)
  }

  await connectDb();

  const redisClient = redis.createClient(conf.secret.redis.port, conf.secret.redis.host);
  redisClient.on('error', function (err) {
    console.error('redis-error: ' + err);
  });

  global.redisClient = redisClient;

  const redisExists = promisify(redisClient.exists).bind(redisClient)

  // delete cache of removed, history projects
  let i = 0;
  const oldProjects = await Project.find({ctype:{$in:['history', 'deletedProject']}}).select('_id').exec();
  const oldProjectLength = oldProjects.length;
  for(const project of oldProjects) {
    i++;
    console.log(`${i}/${oldProjectLength}`);
    await deleteProject(`GBE::PROJ::${project._id}`);
  }

  console.log('fetching new projects')

  const projects = await Project.find({ctype:{$in:['source', 'project', 'flatProject']}}).select('_id').exec();
  const projectLength = projects.length;
  // redisClient.exists('123',redis.print);
  // console.log(await redisExists('123'));
  i=0;
  for(const project of projects) {
    i++;
    console.log(`${i}/${projectLength}`);
    const {_id} = project;
    const key = `GBE::PROJ::${_id}`;
    if (await redisExists(key)) {
      console.log(`found ${_id}`);
    } else {
      console.log('no found');
      const result = await Project.findById(_id)
        .populate({
          path:'parts',
        })
        .exec();
      console.log(`saving ${result._id}`);
      await saveProject(result);
      const memSize = await getMemUsage(redisClient);
      // console.log(memSize);
      if (memSize > conf.redis.prefetchMaxSize) {
        console.log('reach the limit of prefetchMaxSize')
        break;
      }
    }
  }
  console.log('finish preloading');
}

main().then(()=>{
  console.log('worker exit');
  process.exit();
})