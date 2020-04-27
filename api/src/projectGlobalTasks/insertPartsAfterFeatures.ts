
import { Project, AnnotationPart } from '../models';
import { readSequenceFromSequenceRef, generateSequenceRef } from '../sequenceRef';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import conf from '../conf';
import { projectToGFFJSON } from './projectImportExport';
import FormData from 'form-data';
import Axios from 'axios';

export async function insertPartsAfterFeatures( user:IUser, 
                                                id:string, 
                                                featureType:string, 
                                                direct:number, 
                                                offset:number, 
                                                sequenceType: string,
                                                sequence:string, 
                                                clientToken:any) {
  const gffJson = await projectToGFFJSON(id);
  // call webexe
  // uploading file
  try {
    const formData = new FormData();
    formData.append('file', Buffer.from(JSON.stringify(gffJson), 'utf-8'), 'project.gff.json');
    const result = await Axios.post(`${conf.webexe.internalUrl}/api/fileParam/`,
      formData.getBuffer(),
      {
        headers: {
          ...formData.getHeaders(),
          'Cookie': `token=${clientToken}`,
        }
      });
    const gffJsonFilePath = result.data.filePath;
    // call webexe again to start mission
    const result2 = await Axios.post(`${conf.webexe.internalUrl}/api/task/insert_parts_after_features`,
    {
      params: {
        srcFileName:[gffJsonFilePath],
        featureType,
        direct,
        offset,
        sequenceType,
        sequence,
        
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