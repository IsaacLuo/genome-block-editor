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

const GUEST_ID = '000000000000000000000000';

const app = new koa();
const router = new Router();

type Ctx = koa.ParameterizedContext<ICustomState, {}>;
type Next = ()=>Promise<any>;


app.use(cors({credentials: true}));
app.use(serve('./public'));
app.use(koaBody());
middleware(app);

function userMust (...args: Array<(ctx:koa.ParameterizedContext<any, {}>, next:()=>Promise<any>)=>boolean>) {
  const arg = arguments;
  return async (ctx:koa.ParameterizedContext<any, {}>, next:Next)=> {
    if (Array.prototype.some.call(arg, f=>f(ctx))) {
      await next();
    } else {
      ctx.throw(401);
    }
  };
}

function beUser (ctx:Ctx, next?:Next) {
  // console.log(ctx.state.user.groups);
  return !!(ctx.state.user && (ctx.state.user.groups.indexOf('emma/users')>=0 || ctx.state.user.groups.indexOf('users')>=0));
  // return ctx.state.user!== undefined;
}

function beAnyOne (ctx:Ctx, next?:Next) {
  // console.log(ctx.state.user.groups);
  // return ctx.state.user && (ctx.state.user.groups.indexOf('emma/users')>=0 || ctx.state.user.groups.indexOf('users')>=0);
  return ctx.state.user!== undefined;
}

function beAdmin (ctx:Ctx, next?:Next) {
  return ctx.state.user && (ctx.state.user.groups.indexOf('administrators')>=0 || ctx.state.user.groups.indexOf('emma/administrators')>=0);
}

function beGuest (ctx:Ctx, next?:Next) {
  return ctx.state.user === undefined || ctx.state.user._id === '000000000000000000000000';
}

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
