/// <reference path="../../@types/index.d.ts" />
import { userMust, beUser } from '../../userMust'
import koa from 'koa';
import workerTs from '../../workerTs';
type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

export default (router) => {

  router.put('/api/globalTasks/removeGeneratedFeatures/:id', 
  userMust(beUser),
  async (ctx:Ctx, next:Next)=> {
    await (new Promise((resolve, reject)=>{
      const {id} = ctx.params;
      const worker = workerTs(`${__dirname}/removeGeneratedFeatures_worker`, {});
      worker.on("message", ({type, data}) => {
        switch(type) {
          case 'result':
            ctx.body = {message:'OK', newProjectId: data};
            resolve();
            break;
        }
      });
      worker.postMessage({type:'startTask', data:id});
    }))
  });
}
