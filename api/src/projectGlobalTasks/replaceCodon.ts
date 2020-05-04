import mongoose from 'mongoose';
import {Project} from '../models';
import {projectToGFFJSON} from './projectImportExport'
import axios from 'axios';
import FormData from 'form-data';
import conf from '../conf.json';

export const replaceCodon = async (user:IUserEssential, _id:string|mongoose.Types.ObjectId, rules:string, clientToken:string) => {
  // const projectObj = await Project.findById(_id).exec();
  // const project = await projectObj.toObject();

  const gffJson = await projectToGFFJSON(_id);
  // call webexe
  // uploading file
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from(JSON.stringify(gffJson), 'utf-8'), 'project.gff.json');
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
    const result2 = await axios.post(`${conf.webexe.internalUrl}/api/task/replace_codons`,
    {
      params: {
        srcFileName:[gffJsonFilePath],
        rules,
      },
    },
    {
      headers: {
        'Cookie': `token=${clientToken}`,
      }
    });
    return {debugData: result.data, taskInfo: {...result2.data, serverURL: conf.webexe.url, processId: result2.data.processId},};
  } catch (err) {
    console.error(err);
  }
}