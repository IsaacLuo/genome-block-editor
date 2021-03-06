
import { Project, AnnotationPart } from '../../models';
import { readSequenceFromSequenceRef, generateSequenceRef } from '../../sequenceRef';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import conf from '../../conf';
import { projectToGFFJSON, projectToGFFJSONPartial } from '../projectImportExport';
import FormData from 'form-data';
import Axios from 'axios';

/**
 * insert some fragement sequence after each gene in selected range
 * TODO: it's an old process which still using webexe, should be updated
 * @param user: not using for now
 * @param _id: project id
 * @param featureType the feature to locate the insertion position
 * @param direct -1: insert at 5`, 1: insert at 3`
 * @param offset how many bp before/after the maketed feature
 * @param sequenceType the type of the new feature to be instered
 * @param sequence the sequence in bp
 * @param selectedRange ROI
 * @param clientToken: the token to be passed to worker
 */
export async function insertPartsAfterFeatures( user:IUser, 
                                                _id:string, 
                                                featureType:string, 
                                                direct:number, 
                                                offset:number, 
                                                sequenceType: string,
                                                sequence:string,
                                                selectedRange: IRange,
                                                clientToken:any) {
  let gffJson;
  if (selectedRange) {
    gffJson = await projectToGFFJSONPartial(_id, selectedRange);
  } else {
    gffJson = await projectToGFFJSON(_id);
  }
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
      comments: {
        taskName: 'insert_parts_after_features',
        _id,
        selectedRange,
      }
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