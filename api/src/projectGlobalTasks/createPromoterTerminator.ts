/// <reference path="../@types/index.d.ts" />
import { userMust, beUser } from '../userMust'
import {User, Project, AnnotationPart} from '../models'
import koa from 'koa';
import axios from 'axios';
import conf from '../conf.json';
import FormData from 'form-data';
import { projectToGFFJSON, projectToGFFJSONPartial } from './projectImportExport';
import bigjson from 'big-json';
import fs from 'fs/promises';

type Ctx = koa.ParameterizedContext<ICustomState>;
type Next = ()=>Promise<any>;

export default (router) => {

  router.put('/api/mapping_project/gen_pro_ter/from/:id', 
  userMust(beUser),
  async (ctx:Ctx, next:Next)=> {
    const _id = ctx.params.id;
    const clientToken = ctx.cookies.get('token');
    const {promoterLength, terminatorLength, selectedRange} = ctx.request.body;
    let startTime = Date.now();
    console.log('query project', selectedRange);
    // first get project genes and generate gff json
    let gffJson;
    if (selectedRange) {
      gffJson = await projectToGFFJSONPartial(_id, selectedRange, );
    } else {
      gffJson = await projectToGFFJSON(_id, );
    }
    // call webexe
    // uploading file
    try {
    const formData = new FormData();
    formData.append('file', Buffer.from(JSON.stringify(gffJson), 'utf-8'), 'gene.gff.json');
    // const stringifyStream = bigjson.createStringifyStream(gffJson);
    // formData.append('file', stringifyStream, 'gene.gff.json');
    // const tempFname = Date.now().toString();
    // stringifyStream.on('data', function(strChunk) {
    //   // => BIG_POJO will be sent out in JSON chunks as the object is traversed
    //   fs.open(tempFname,'w');
    // });

    const result = await axios.post(`${conf.webexe.internalUrl}/api/fileParam/`,
      formData.getBuffer(),
      // formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Cookie': `token=${clientToken}`,
        },
        maxContentLength: 500000000,
        // maxBodyLength: 1000000000,
      });
    const gffJsonFilePath = result.data.filePath;
    // call webexe again to start mission
    // console.log('file uploaded', project.len, Date.now() - startTime);
    const result2 = await axios.post(`${conf.webexe.internalUrl}/api/task/generate_promoter_terminator`,
    {
      params: {
        srcFileName:[gffJsonFilePath],
        promoterLength,
        terminatorLength,
      },
      comments: {
        taskName: 'generate_promoter_terminator',
        _id,
        promoterLength,
        terminatorLength,
        selectedRange,
      }
    },
    {
      headers: {
        'Cookie': `token=${clientToken}`,
      }
    });
    // console.log('task created', project.len, Date.now() - startTime);
    ctx.body = {debugData: result.data, taskInfo: {...result2.data, serverURL: conf.webexe.url, processId: result2.data.processId},};
  } catch (err) {
    console.error(err);
    ctx.throw(500, 'unable to process');
  }
  })   
}
