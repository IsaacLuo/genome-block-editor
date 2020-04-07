import {updateProjectByGFFJSON} from './projectImportExport'
import request from 'supertest'
import mongoose from 'mongoose';
import {Project} from '../models';
import connectMongoDB from '../mongodb';

describe('test of updateProjectByGFFJSON', ()=>{
  let user:IUserEssential;
  let project:IProject;
  beforeAll(async ()=>{
    await connectMongoDB();
    user = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@gmail.com',
      groups:['users'],
      name:'Test User',
    }

    project = await Project.findOne({ctype:'source'}).exec();
    // console.log(project);
    console.log('project prepared? ', !!project);
  }, 10000);

  test('fork a project', async ()=>{
    
  });
})
