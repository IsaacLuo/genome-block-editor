import koa from 'koa';
import log4js, {Appender, LogLevelFilterAppender} from 'log4js';
import mongoose from 'mongoose';
import conf from './conf.json';
import koaJwt from 'koa-jwt';
import jwt from 'jsonwebtoken';

const mainAppender:LogLevelFilterAppender = {
  type: 'logLevelFilter',
  appender: 'default.log',
  level: 'DEBUG',
}

log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: 'logs/access.log',
      maxLogSize: 1024,
      backups:0,
    },
    console: {
      type: 'console',
    }
  },
  categories: {
    default: {
      appenders: ['console', 'file'],
      level: 'debug',
    }
  }
});

export default function middleware (app:koa) {
  const logger = log4js.getLogger();

  // 500 middleware
  app.use( async (ctx, next)=> {
    try {
      await next();
    } catch(err) {
      logger.error('>>>>error', err.message);
      ctx.response.status = err.statusCode || err.status || 500;
      ctx.response.body = {
        message: err.message,
      }
      ctx.app.emit('error', err, ctx);
    }
  });

  // mongodb
  app.use( async (ctx:koa.ParameterizedContext<any, {}>, next: ()=>Promise<any>)=> {
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
      ctx.throw(500,'db connection error');
    }
    await next();
    
  });

  // always json type
  app.use( async (ctx:koa.ParameterizedContext<any, {}>, next: ()=>Promise<any>)=> {
    ctx.type = 'json';
    // ctx.body = {};
    await next();
  });

  app.use(koaJwt({
    secret: conf.secret.jwt.key,
    cookie: 'token',
    passthrough: true,
  })
  // .unless({
  //   path: [
  //     /\//,
  //   ]
  // })
  );

  /**
   * if user is undefined, create a guest user
   */
  app.use(async (ctx:koa.ParameterizedContext<any, {}>, next: ()=>Promise<any>)=> {
    if(ctx.state.user === undefined) {
      // console.debug('user is undefined set it to guest')
      ctx.state.user = {
        _id: '000000000000000000000000',
        fullName: 'guest',
        email: '',
        groups: [
            'guest'
        ],
        iat: Math.floor(Date.now()/1000),
        exp: Math.floor(Date.now()/1000)+86400,
      };
    }
    await next();
  });

  // log
  app.use( async (ctx:koa.ParameterizedContext<any, {}>, next: ()=>Promise<any>)=> {
    if (ctx.URL.pathname == '/graphql') {
      if ( ctx.request.body.operationName !== 'IntrospectionQuery') {
        logger.info(ctx.request.ip, ctx.state.user.fullName, ctx.request.body.operationName);
        logger.debug(ctx.request.body.query);
      }
    } else {
      logger.info(ctx.request.ip, ctx.state.user.fullName, ctx.method, ctx.URL.pathname);
    }
    
    await next();
  });

}