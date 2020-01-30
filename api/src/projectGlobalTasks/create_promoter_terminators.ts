/// <reference path="../@types/index.d.ts" />
import { userMust, beUser } from '../userMust'
import {User, Project} from '../models'
import koa from 'koa';
type Ctx = koa.ParameterizedContext<ICustomState, {}>;
type Next = ()=>Promise<any>;

export default (router) => {

router.put('/api/mapping_project/gen_pro_ter/from/:id', 
async (ctx:Ctx, next:Next)=> {
  const _id = ctx.params.id;
  // first get project genes and generate gff json
  const project = await Project.findById(_id).exec();
});
}