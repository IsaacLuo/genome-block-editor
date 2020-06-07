/// <reference path="@types/index.d.ts" />


import koa from 'koa';
import koaBody from 'koa-body';
import send from 'koa-send';
import middleware from './middleware'
import Router from 'koa-router';
import log4js from 'log4js';
import conf from './conf';
import {Project, User, AnnotationPart, IAnnotationPartModel} from './models';
import jwt from 'jsonwebtoken';
import cors from 'koa-cors';
import mongoose, { Mongoose } from 'mongoose';
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
import { projectToGFFJSON, updateProjectByGFFJSON, updateProjectByGFFJSONPartial, projectToGFFJSONPartial, projectToGenbank } from './projectGlobalTasks/projectImportExport';
import { replaceCodon } from './projectGlobalTasks/replaceCodon';
import { removeIntron } from './projectGlobalTasks/removeIntron';

import axios from 'axios';
import crypto from 'crypto';
import { runExe } from './runExe';
import { reverseComplement, readSequenceFromSequenceRef, generateSequenceRef } from './sequenceRef';
import { insertPartsAfterFeatures } from './projectGlobalTasks/insertPartsAfterFeatures';
import {updateParents} from './projectGlobalTasks/projectImportExport';

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
    // console.log(project);
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
  ctx.body = 'hello world';
},

async (ctx:Ctx, next:Next)=> {
  await sleep(3000);
  ctx.body = 'hello again';
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
  console.log('write cache file', ctx.state.cacheFileName);
  saveProjectStr(ctx.body._id, resultStr);
  fs.promises.writeFile(ctx.state.cacheFileName, resultStr).then(()=>{console.log('file write done')});
  
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

router.get('/api/webexe/file/:fileUrl/as/:fileName',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {fileUrl, fileName} = ctx.params;  
  const clientToken = ctx.cookies.get('token');
  const result = await axios.get(`${conf.webexe.internalUrl}/api/resultFile/${fileUrl}/as/${fileName}`,
  {
    headers: {
      'Cookie': `token=${clientToken}`,
    }
  });
  ctx.set('Content-Type', 'application/octstream');
  ctx.body = result.data;
})

router.put('/api/project/:id/fromFileUrl',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  const project = await Project.findById(id).exec();
  if (!project) {
    ctx.throw(404);
  }
  const {fileUrl, partialUpdate, range} = ctx.request.body;
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

  let newItem;
  if (partialUpdate) {
    newItem = await updateProjectByGFFJSONPartial(project, gffObj, range);
  } else {
    newItem = await updateProjectByGFFJSON(project, gffObj);
  }
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
  const {rules, selectedRange} = ctx.request.body;
  const clientToken = ctx.cookies.get('token');
  
  ctx.body = await replaceCodon(user, id, rules, selectedRange, clientToken);
  // console.log(ctx.body);
});

router.post('/api/mapping_project/insert_parts_after_features/from/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const {featureType, direct, offset, sequenceType, sequence, selectedRange} = ctx.request.body;
  const clientToken = ctx.cookies.get('token');
  
  ctx.body = await insertPartsAfterFeatures(user, id, featureType, direct, offset, sequenceType, sequence, selectedRange, clientToken);
  // console.log(ctx.body);
});

router.post('/api/mapping_project/remove_introns/from/:id',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const {intronTypes, selectedRange} = ctx.request.body;
  const clientToken = ctx.cookies.get('token');
  ctx.body = await removeIntron(user, id, intronTypes, selectedRange, clientToken);
  // console.log(ctx.body);
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

// do global sequence alignment
// @body parameters
//     sequence1: string
//     sequence2: string
// @result
//      
router.post('/api/query/globalAlignment',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {sequence1, sequence2} = ctx.request.body;

  // run python
  await runExe(
    {
      program:'pipenv', 
      params:['run', 'python', 'global_alignment.py'], 
      options:{cwd:'utility'}
    }, 
    {sequence1, sequence2},
    (outputObj:any)=>{
      console.log(outputObj[0]);
      // ctx.body = {message:0}
      ctx.body = outputObj[0];
  });

});


// get sequence of a project, by giving id, start, end
router.get('/api/project/:id/sequence',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  let {start, end, strand} = ctx.request.query;
  start = parseInt(start);
  end = parseInt(end);
  strand = parseInt(strand);
  // load project first
  let project = await Project.findById(id).populate({
    path:'parts',
    match:{start:{$gte: start}, end:{$lte:end}},
  }).exec();
  project = await project.toObject();

  let sequence;
  let skipBuiltPart;
  if (project.built) {
    // if project is built, load sequence directly from the project's ref
    sequence = await readSequenceFromSequenceRef({fileName: project.sequenceRef.fileName, start, end, strand})
  } else {
    // build part sequence
    let sequenceArr;
    if (project.sequenceRef) {
      sequence = await readSequenceFromSequenceRef({fileName: project.sequenceRef.fileName, start, end, strand});
      sequenceArr = sequence.split('');
      skipBuiltPart = true;
    } else {
      sequenceArr = new Array(end - start).fill('N')
      skipBuiltPart = false;
    }
    // const parts = await AnnotationPart.find({_id:{$in:project.parts}, start:{$gte: start}, end:{$lte:end}});
    for(const part of project.parts) {
      if (skipBuiltPart && part.built) {
        continue;
      }
      const partSequence = await readSequenceFromSequenceRef(part.sequenceRef, 0);
      for (let i=0;i<partSequence.length;i++) {
        const j = part.start - start + i;
        if (sequenceArr[j] !== 'N' && sequenceArr[j] !== partSequence[i].toUpperCase()) {
          ctx.throw(500, `conflict sequence data at ${i} with part ${part.name}`);
        }
        sequenceArr[j] = partSequence[i].toUpperCase();
      }
    }
    sequence = sequenceArr.join('');
  }
  
  ctx.body = {message:'OK', start, end, strand, sequence, parts: project.parts, projectBuilt: project.built, skipBuiltPart};
});

router.get('/api/project/:id/genbank',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {id} = ctx.params;
  let {start, end} = ctx.request.query;
  const clientToken = ctx.cookies.get('token');
  ctx.body = await projectToGenbank(id, {start,end}, clientToken);
}
)

const sortParts = (parts:IAnnotationPart[]) => {
  return parts.sort((a,b)=>{
    if (a.start < b.start) {
      return -1;
    }
    if (a.start > b.start) {
      return 1;
    }
    if (a.end > b.end) {
      return -1;
    }
    if (a.end < b.end) {
      return 1;
    }
    return a.level < b.level ? -1 : 1;
  })
}

router.post('/api/project/:id/sequence/:start/:end',
userMust(beUser),
async (ctx:Ctx, next:Next)=> {
  const {sequence} = ctx.request.body;
  let {id, start, end} = ctx.params;
  start = parseInt(start);
  end = parseInt(end);
  const project = await Project.findById(id).exec();
  const originalSequence = await readSequenceFromSequenceRef(project.sequenceRef);
  
  if(originalSequence.substring(start, end) === sequence) {
    // the same, do nothing
    ctx.body = {message:'same sequence, nothing changed'}
    await next();
    return;
  }

  let newSequence = originalSequence.substring(0, start) + sequence + originalSequence.substring(end);
  let newSequenceRef = await generateSequenceRef(newSequence);
  let parts;
  let upgradePartIdDict = {};
  let upgradedPartIds = new Set<string>();
  if (sequence.length === end - start) {
    // same length, replace the sequence, update parts in this area
    let partsOnLeft = await AnnotationPart.find({_id:{$in:project.parts}, end:{$lte:start}}).sort({start:1, end:-1, level:1}).exec();
    let partsOnRight = await AnnotationPart.find({_id:{$in:project.parts}, start:{$gte:end}}).sort({start:1, end:-1, level:1}).exec();

    let partsInRange = await AnnotationPart.find({_id:{$in:project.parts}, $or:[{start:{$gte:start, $lt:end}}, {end:{$gt:start, $lte:end}}, {start:{$lt: start}, end:{$gt: end}}]}).sort({start:1, end:-1, level:1}).exec();
    const newParts = await Promise.all(partsInRange.map(async (v:IAnnotationPartModel)=>{
      const part:IAnnotationPart = v.toObject();
      const oldPartId = part._id;
      part.sequenceRef = {fileName:newSequenceRef.fileName, start: part.start, end: part.end, strand: part.strand};
      const partSeq = await readSequenceFromSequenceRef(part.sequenceRef);
      part.sequenceHash = crypto.createHash('md5').update(partSeq).digest("hex");
      part.history = [{_id:part._id, updatedAt:part.updatedAt, chagnelog:part.changelog},...part.history];
      part.original = false;
      part.built = true;
      part.changelog = 'freestyle edited';
      delete part._id;
      const newPart = await AnnotationPart.create(part);
      upgradePartIdDict[oldPartId.toString()] = newPart._id;
      upgradedPartIds.add(newPart._id.toString());
      return newPart;
    }));
    parts = [...partsOnLeft, ...newParts, ...partsOnRight];
  } else {
    // differenct length, remove overlapped feature, and create new one
    let partsOnLeft = await AnnotationPart.find({_id:{$in:project.parts}, end:{$lte:start}}).sort({start:1, end:-1, level:1}).exec();
    let partOfEdited = await AnnotationPart.create({
      pid: new mongoose.Types.ObjectId(),
      featureType: 'region',
      start,
      end: start+sequence.length,
      strand: 0,
      name: 'Edited Region',
      original: false,
      history: [],
      sequenceHash: crypto.createHash('md5').update(sequence).digest("hex"),
    });
    // then, shift featrues after
    let partsOnRight = await AnnotationPart.find({_id:{$in:project.parts}, start:{$gte:end}}).sort({start:1, end:-1, level:1}).exec();
    const movedPartsOnRight = await Promise.all(partsOnRight.map(async (v:IAnnotationPartModel)=>{
      const part:IAnnotationPart = v.toObject();
      const oldPartId = part._id;
      part.history = [{_id:part._id, updatedAt:part.updatedAt, chagnelog:part.changelog},...part.history];
      part.original = false;
      part.built = false;
      part.changelog = 'moved because freestyle edtied';
      delete part._id;
      const newPart = await AnnotationPart.create(part);
      upgradePartIdDict[oldPartId.toString()] = newPart._id;
      upgradedPartIds.add(newPart._id.toString());
      return newPart;
    }))

    parts = [...partsOnLeft, partOfEdited, ...partsOnRight];
  }
  //sort parts
  parts = sortParts(parts)
  parts = await updateParents(parts, upgradePartIdDict, upgradedPartIds);
  parts = parts.map(v=>v._id);

  const projectObject = project.toObject();
  projectObject.parts = parts;
  projectObject.sequenceRef = newSequenceRef;
  projectObject.history = [{_id:projectObject._id, updatedAt:projectObject.updatedAt, chagnelog:projectObject.changelog},...projectObject.history];
  projectObject.changelog = `sequence changed at ${start} - ${end}`;
  delete projectObject._id;

  let newProject = await Project.create(projectObject);

  await Project.updateOne({_id:project._id}, {ctype:'history'});

  ctx.body = {message:'OK', projectId: newProject._id.toString()};
}
)

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
