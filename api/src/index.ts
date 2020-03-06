/// <reference path="@types/index.d.ts" />


import koa from 'koa';
import koaBody from 'koa-body';
import send from 'koa-send';
import middleware from './middleware'
import Router from 'koa-router';
import log4js from 'log4js';
import conf from './conf.json';
import {Project, User} from './models';
import jwt from 'jsonwebtoken';
import cors from 'koa-cors';
import mongoose from 'mongoose';
// import { graphqlKoa, graphiqlKoa } from 'graphql-server-koa'
import {useApolloServer} from './graphql';
import serve from 'koa-static';
import { userMust, beUser } from './userMust';
import createPromoterTerminators from './projectGlobalTasks/createPromoterTerminator'
import removeGeneratedFeatures from './projectGlobalTasks/removeGeneratedFeatures'
import redis from 'redis'

import http from 'http';
import socket from 'socket.io';
import fs from 'fs';
import { saveProject, deleteProject, loadProjectStr, saveProjectStr } from './redisCache';
import workerTs from './workerTs';

require('dotenv').config()

const { promisify } = require('util');
const fs_exists = promisify(fs.exists);
const fs_writeFile = promisify(fs.writeFile);
const fs_readFile = promisify(fs.readFile);

type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

const GUEST_ID = '000000000000000000000000';

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const app = new koa();
const router = new Router();

declare global {
  namespace NodeJS {
    interface Global {
      redisClient?: redis.RedisClient
    }
  }
}

if (conf.redis.useRedis) {
  global.redisClient = redis.createClient(conf.secret.redis.port, conf.secret.redis.host);
  global.redisClient.on('error', function (err) {
    console.error('redis-error: ' + err);
  });
  if (process.env.NODE_ENV === 'production') {
    workerTs(`${__dirname}/script/preloadRedis`, {});
    workerTs(`${__dirname}/script/clearIsolatedParts`, {});
  }
}


app.use(cors({credentials: true}));
app.use(serve('./public'));
app.use(koaBody());
middleware(app);

router.post('/api/session', 
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  
  if (user) {
    const {_id, name, email, groups} = user;
    await User.updateOne({_id: user._id}, {_id, name, email, groups, lastLogin: new Date(), lastIP: ctx.request.ip}, {upsert:true}).exec();
    ctx.body = {message:'OK', user,};
  } else {
    ctx.throw(401, 'user is not logged in');
  }
});

router.get('/api/user/current', async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  ctx.body = {message:'OK', user,};
  if (user) {
    const now = Math.floor(Date.now() / 1000);
    const eta = user.exp - now;
    ctx.body.eta = eta;
  }
});


// fork project
router.post('/api/project/forkedFrom/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const {name} = ctx.request.query;
  const project = await (await Project.findById(id).exec()).toObject();
  if (name) {
    project.name = name;
  } else {
    const now = new Date();
    project.name += `[${now.toLocaleDateString()} ${now.toLocaleTimeString()}]`
  }
  project.projectId = new mongoose.Types.ObjectId();
  project.ctype = 'project';
  project.owner = user._id;
  project.group = user.groups;
  project.permission = 0x600;
  project.history = [project._id, ...project.history];
  project._id = undefined;
  delete project._id;
  const result = await Project.create(project);
  ctx.body = {_id:result._id, projectId:result.projectId};

  // save to redis
  saveProject(result);
});

// delete project
router.delete('/api/project/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const project = await Project.findById(id).exec();
  if (project.ctype === 'project' || project.ctype === 'flatProject') {
    await Project.update({_id:id}, {ctype:'deletedProject', updatedAt: new Date()});
    
    // save to redis
    deleteProject(id);

    ctx.body = {message:'OK'}
  } else if (project.ctype === 'deletedProject') {
    console.log(project);
    ctx.body = {message:'OK but nothing changed'}
  }
  else {
    ctx.throw(401, `project type is ${project.ctype}`);
  }
});

router.get('/api/test',
async (ctx:Ctx, next:Next)=> {
  console.log('1');
  ctx.body = 'hello world';
},

async (ctx:Ctx, next:Next)=> {
  await sleep(3000);
  console.log('inside');
  console.log('2');
  ctx.body = 'hello again';
  console.log('3');
},

)

// load source file
router.get('/api/sourceFile/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const start = Date.now();
  await next();
  const time = Date.now() - start;
  console.debug('normal query time = ', time);
},
async (ctx:Ctx, next:Next)=> {
  // load everything except sequence
  const {id} = ctx.params;
  const start = Date.now();
  let result;

  // try to load from redis
  result = await loadProjectStr(id);
  if (result) {
    console.debug('loaded from redis')
    ctx.body = result;
  } else {
    result = await Project.findById(id)
      .exec();
    let cacheFileName = './public/sourceFileCaches/'+id;
    if (result.ctype !== 'source') {
      cacheFileName+= result.updatedAt.getTime();
    }
    cacheFileName+='.'
    cacheFileName+=result.ctype
    console.debug(cacheFileName)
    if(await fs_exists(cacheFileName)) {
      console.debug('cache file exists')
      await send(ctx,cacheFileName);
      fs.readFile(cacheFileName, 'utf8', (err, data)=>{
        saveProjectStr(id, data);
      })
    } else {
      console.debug('cache file not exists')
      // console.log(result.updatedAt);
      result = await Project.findById(id)
        .populate({
          path:'parts',
        })
        .exec();
      const time = Date.now() - start;
      console.debug('time = ', time);
      ctx.body = result;
      ctx.state.cacheFileName = cacheFileName;
      next(); // do not use await
    }
  }
},
async (ctx:Ctx, next:Next)=> {
  const resultStr = JSON.stringify(ctx.body);
  saveProjectStr(ctx.body._id, resultStr);
  fs.promises.writeFile(ctx.state.cacheFileName, resultStr);
}
)

createPromoterTerminators(router);
removeGeneratedFeatures(router);

// router.get('/api/admin/clearIsolatedParts', clearIsolatedParts);


app.use(router.routes());

router.post('/graphql', async (ctx:Ctx, next:Next)=> {
  const start = Date.now();
  await next();
  const time = Date.now() - start;
  console.log('graphql time = ', time);
});

useApolloServer(app);


// ----------------------------------socket.io part----------------------------------------------
const server = http.createServer(app.callback());
const io = socket(server);


// -----------------------------------------------------------------------------------------------
app.use(router.routes());
// app.listen(conf.port, '0.0.0.0');
server.listen(process.env.PORT);

log4js.getLogger().info(`start listening at ${process.env.PORT}`);
