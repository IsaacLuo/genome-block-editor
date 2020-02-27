/// <reference path="../@types/index.d.ts" />
import { userMust, beUser } from '../userMust'
import {User, Project, AnnotationPart} from '../models'
import koa from 'koa';
import axios from 'axios';
import conf from '../conf.json';
import FormData from 'form-data';
import workerTs from '../workerTs';
type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

export default (router) => {

  router.put('/api/globalTasks/removeGeneratedFeatures/:id', 
  userMust(beUser),
  async (ctx:Ctx, next:Next)=> {
    const {id} = ctx.params;
    const worker = workerTs(`${__dirname}/removeGeneratedFeatures_worker`, {});
    worker.on("message", resp => {
      // ...
      console.log('from worker: ', resp);
    });
    worker.postMessage({type:'startTask', data:id});
  });
}
