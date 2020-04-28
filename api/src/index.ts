/// <reference path="@types/index.d.ts" />


import koa from 'koa';
import koaBody from 'koa-body';
import send from 'koa-send';
import middleware from './middleware'
import Router from 'koa-router';
import log4js from 'log4js';
import conf from './conf';
import {Project, User, AnnotationPart} from './models';
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
import { saveProject, deleteProject, loadProjectStr, saveProjectStr, loadProjectIdStr, saveProjectIdStr } from './redisCache';
import workerTs from './workerTs';
import { forkProject, hideProject, revertProject } from './projectGlobalTasks/project';
import { projectToGFFJSON, updateProjectByGFFJSON } from './projectGlobalTasks/projectImportExport';
import { replaceCodon } from './projectGlobalTasks/replaceCodon';

import axios from 'axios';
import { runExe } from './runExe';
import { reverseComplement, readSequenceFromSequenceRef } from './sequenceRef';
import { insertPartsAfterFeatures } from './projectGlobalTasks/insertPartsAfterFeatures';

require('dotenv').config()

const { promisify } = require('util');
const fs_exists = promisify(fs.exists);
const fs_read = promisify(fs.read);

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

router.get('/', async (ctx:Ctx, next:Next)=> {
  ctx.body = {message:'OK'};
});

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
  ctx.body = await forkProject(user, id, name);
});

// delete project
router.delete('/api/project/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const project = await Project.findById(id).exec();
  if (project.ctype === 'project' || project.ctype === 'flatProject') {
    await hideProject(id);
    ctx.body = {message:'OK'}
  } else if (project.ctype === 'deletedProject') {
    console.log(project);
    ctx.body = {message:'OK but nothing changed'}
  }
  else {
    ctx.throw(401, `project type is ${project.ctype}`);
  }
});

// get seqeunce of project
router.get('/api/project/:id/gffJson',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  ctx.body = await projectToGFFJSON(id);
})

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
// load source file by projectId
router.get('/api/sourceFile/byProjectId/:pid',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {pid} = ctx.params;
  const _id = await loadProjectIdStr(pid);
  if (_id) {
    ctx.redirect(`/api/sourceFile/${_id}`);
  } else {
    const result = await Project.findOne({projectId:pid, $or:[{ctype:'project'}, {ctype:'flatProject'}]}).exec();
    if(result) {
      saveProjectIdStr(result.projectId.toString(), result._id.toString());
      ctx.redirect(`/api/sourceFile/${result._id}`);
    } else {
      ctx.throw(404);
    }
  }
}
);
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
    let cacheFileName = `./${conf.rootStorageFolder}/sourceFileCaches/${id}`;
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

// load source file history
router.get('/api/sourceFile/:id/history',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  const result = await Project.findById(id)
    .select('history name')
    .exec()
  ctx.body = result;
});

router.get('/api/part/:id/sequence',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  const part = await AnnotationPart.findById(id).exec();
  if (!part.sequenceRef) {
    ctx.throw(404, 'cannot find sequence ref');
  }
  const {fileName, start, end, strand} = part.sequenceRef;
  const fp = await fs.promises.open(`${conf.rootStorageFolder}/sequences/${fileName}`, 'r');
  const bufferSize = end-start;
  const buffer = new Buffer(bufferSize);
  const {bytesRead} = await fs_read(fp.fd, buffer, 0, end-start, start);
  let sequence = buffer.toString('utf8', 0, bufferSize);
  if (strand < 0) {
    sequence = reverseComplement(sequence);
  }
  ctx.body = {sequence, len: bytesRead};
})



createPromoterTerminators(router);
removeGeneratedFeatures(router);

router.put('/api/project/:id/fromFileUrl',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  const project = await Project.findById(id).exec();
  if (!project) {
    ctx.throw(404);
  }
  const fileUrl = ctx.request.body.fileUrl;
  // get file from webexe server
  const clientToken = ctx.cookies.get('token');
  console.log(`${conf.webexe.internalUrl}/api/resultFile/${fileUrl.url}/as/${fileUrl.name}`);
  const result = await axios.get(`${conf.webexe.internalUrl}/api/resultFile/${fileUrl.url}/as/${fileUrl.name}`,
  {
    headers: {
      'Cookie': `token=${clientToken}`,
    }
  });
  const gffObj = result.data;
  const newItem = await updateProjectByGFFJSON(project, gffObj);
  
  ctx.body={message:'OK', newProjectId:newItem._id}
})

router.post('/api/sourceFile/:id/revert',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  console.debug('revert project', id);
  ctx.body = await revertProject(id);
  // try {
  //   // ctx.body = await revertProject(id);
  // } catch (err) {
  //   throw err;
  // }
})


router.post('/api/mapping_project/replace_codons/from/:id', 
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const {rules} = ctx.request.body;
  const clientToken = ctx.cookies.get('token');
  
  ctx.body = await replaceCodon(user, id, rules, clientToken);
  console.log(ctx.body);
});

router.post('/api/mapping_project/insert_parts_after_features/from/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const {featureType, direct, offset, sequenceType, sequence} = ctx.request.body;
  const clientToken = ctx.cookies.get('token');
  
  ctx.body = await insertPartsAfterFeatures(user, id, featureType, direct, offset, sequenceType, sequence, clientToken);
  console.log(ctx.body);
});

// router.get('/api/admin/clearIsolatedParts', clearIsolatedParts);

router.get('/api/part/:id/seqAlignmetWith/:anotherPartId',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id, anotherPartId} = ctx.params;

  const part1 = await AnnotationPart.findById(id).exec();
  const part2 = await AnnotationPart.findById(anotherPartId).exec();
  if (!part1 || !part2) {
    ctx.thorw(404, 'unable to find one or more parts');
  }

  const sequence1 = await readSequenceFromSequenceRef(part1.sequenceRef);
  const sequence2 = await readSequenceFromSequenceRef(part2.sequenceRef);

  // run python
  await runExe(
    {
      program:'pipenv', 
      params:['run', 'python', 'global_alignment.py'], 
      options:{cwd:'utility'}
    }, 
    {sequence1, sequence2},
    (outputObj:any)=>{
      // console.log(outputObj[0]);
      // ctx.body = {message:0}
      ctx.body = outputObj[0];
  });

});




app.use(router.routes());

router.post('/graphql', async (ctx:Ctx, next:Next)=> {
  const start = Date.now();
  await next();
  const time = Date.now() - start;
  console.log('graphql time = ', time);
});

useApolloServer(app);


// ----------------------------------socket.io part----------------------------------------------
export const server = http.createServer(app.callback());
const io = socket(server);


// -----------------------------------------------------------------------------------------------
app.use(router.routes());
// app.listen(conf.port, '0.0.0.0');
server.listen(process.env.PORT);

log4js.getLogger().info(`start listening at ${process.env.PORT}`);

export default app;
