/// <reference path="../@types/index.d.ts" />
import { userMust, beUser } from '../userMust'
import {User, Project, AnnotationPart} from '../models'
import koa from 'koa';
import axios from 'axios';
import conf from '../conf.json';
import FormData from 'form-data';
type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

export default (router) => {

  router.put('/api/mapping_project/gen_pro_ter/from/:id', 
  userMust(beUser),
  async (ctx:Ctx, next:Next)=> {
    const _id = ctx.params.id;
    const clientToken = ctx.cookies.get('token');
    const {promoterLength, terminatorLength} = ctx.request.body;
    let startTime = Date.now();
    console.log('query project');
    // first get project genes and generate gff json
    const project = await Project
      .findById(_id)
      .populate({
        path:'parts',
        match: {featureType: 'gene'},
      })
      .exec();
    const gffJson = {
      fileType: "cailab_gff_json",
      version: "0.1",
      seqInfos: {
        [project.name]: {length: project.len}
      },
      records: project.toObject().parts.map(part=>({...part, seqName: project.name})),
    }
    console.log('project found', project.len, Date.now() - startTime);
    // ctx.body = gffJson;

    // call webexe
    // uploading file
    try {
    const formData = new FormData();
    formData.append('file', Buffer.from(JSON.stringify(gffJson), 'utf-8'), 'gene.gff.json');
    const result = await axios.post(`${conf.webexe.internalUrl}/api/fileParam/`,
      formData.getBuffer(),
      {
        headers: {
          ...formData.getHeaders(),
          'Cookie': `token=${clientToken}`,
        }
      });
    const gffJsonFilePath = result.data.filePath;
    // call webexe again to start mission
    console.log('file uploaded', project.len, Date.now() - startTime);
    const result2 = await axios.post(`${conf.webexe.internalUrl}/api/task/generate_promoter_terminator`,
    {
      params: {
        srcFileName:[gffJsonFilePath],
        promoterLength,
        terminatorLength,
      },
    },
    {
      headers: {
        'Cookie': `token=${clientToken}`,
      }
    });
    console.log('task created', project.len, Date.now() - startTime);
    ctx.body = {debugData: result.data, taskInfo: {...result2.data, serverURL: conf.webexe.url, processId: result2.data.processId},};
  } catch (err) {
    console.error(err);
  }
  })   

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
    // read new data from the file
    const originalParts = project.parts;
    const newParts = [];
    for(const record of gffObj.records) {
    
      if (record._id === undefined) {
        // create new feature
        const newAnnotation = await AnnotationPart.create({
          ...record,
          original: false,
        });
        newParts.push(newAnnotation._id);
      }
    }
    // create new project, save current one as history
    const newObj = project.toObject();
    newObj.history = [newObj._id, ...newObj.history];
    newObj.parts = [...newObj.parts, ...newParts];
    delete newObj.updatedAt;
    delete newObj._id;
    const newItem = await Project.create(newObj);
    // old project become history
    await Project.update({_id:id}, {ctype:'history'});
    // const updateResult = await Project.findByIdAndUpdate(ctx.params.id, {parts: [...originalParts, ...newParts]})
    // console.log(updateResult);
    ctx.body={message:'OK', newProjectId:newItem._id}
  })
}
