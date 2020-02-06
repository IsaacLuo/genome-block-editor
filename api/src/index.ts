/// <reference path="@types/index.d.ts" />

import koa from 'koa';
import koaBody from 'koa-body';
import middleware from './middleware'
import Router from 'koa-router';
import log4js from 'log4js';
import conf from '../conf';
import {Project, User} from './models';
import jwt from 'jsonwebtoken';
import cors from 'koa-cors';
import mongoose from 'mongoose';
// import { graphqlKoa, graphiqlKoa } from 'graphql-server-koa'
import {useApolloServer} from './graphql';
import serve from 'koa-static';
import { userMust, beUser } from './userMust';
import createPromoterTerminators from './projectGlobalTasks/createPromoterTerminator'

type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

const GUEST_ID = '000000000000000000000000';

const app = new koa();
const router = new Router();

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
router.post('/api/project/forkedFrom/:id', async (ctx:Ctx, next:Next)=> {
  const user = ctx.state.user;
  const {id} = ctx.params;
  const project = await (await Project.findById(id).exec()).toObject();
  project.ctype = 'project';
  project.owner = user._id;
  project.group = user.groups;
  project.permission = 0x600;
  project.updatedAt = new Date();
  project._id = undefined;
  delete project._id;
  const result = await Project.create(project);
  ctx.body = {_id:result._id};
});

createPromoterTerminators(router);


app.use(router.routes());

router.post('/graphql', async (ctx:Ctx, next:Next)=> {
  const start = Date.now();
  await next();
  const time = Date.now() - start;
  console.log('graphql time = ', time);
});

useApolloServer(app);


// -----------------------------------------------------------------------------------------------
// router.get('/graphql',
// async (ctx:Ctx, next:Next)=> {
//   await graphqlKoa({schema: GraphqlSchema})(ctx, next);
// });
// router.post('/graphql',
// async (ctx:Ctx, next:Next)=> {
//   await graphqlKoa({schema: GraphqlSchema})(ctx, next);
// });

// router.get('/graphiql', 
// async (ctx:Ctx, next:Next)=> {
//   await graphiqlKoa({endpointURL: '/graphql'})(ctx)
// }
// );



// -----------------------------------------------------------------------------------------------


app.listen(8000, '0.0.0.0');
log4js.getLogger().info('start listening at 8000');
