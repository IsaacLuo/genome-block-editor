import {forkProject, hideProject} from './project'
import request from 'supertest'
import mongoose from 'mongoose';
import {Project} from '../models';
import connectMongoDB from '../mongodb';

describe('test of forkProject', ()=>{
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
    const result = await forkProject(user, project._id, 'new name');
    expect(result).not.toBeUndefined();
    expect(result._id).not.toBeUndefined();
    const forkedProject:IProject = await Project.findById(result._id).exec();
    expect(forkedProject.name).toBe('new name');
    expect(['project', 'flatProject']).toContain(forkedProject.ctype);
    expect(forkedProject.owner._id.toString()).toBe(user._id.toString());
    expect(forkedProject.updatedAt.getTime()).toBeGreaterThan(project.updatedAt.getTime());
    await Project.deleteOne({_id:forkedProject._id}).exec();
  })

  test('fork and delete project', async ()=> {
    let result = await forkProject(user, project._id);
    await hideProject(result._id);

    const hidedProject:IProject = await Project.findById(result._id).exec();
    expect(hidedProject.ctype).toBe('deletedProject');
    
    await Project.deleteOne({_id:result._id}).exec();
    await Project.deleteOne({_id:hidedProject._id}).exec();
  }, 10000);
})
