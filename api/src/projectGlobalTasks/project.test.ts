import {forkProject, hideProject} from './project'
import request from 'supertest'
import mongoose from 'mongoose';
import {Project, AnnotationPart} from '../models';
import { connectMemoryMongoDB, stopMongoMemoryServer } from '../mongodb';

import {prepareTestProject, mock_generateSequenceRef, mock_readSequenceFromSequenceRef} from './test/prepareTestProject';
// import { readSequenceFromSequenceRef } from '../sequenceRef';

const seqRef = require("../sequenceRef");

seqRef.generateSequenceRef = mock_generateSequenceRef;
seqRef.readSequenceFromSequenceRef = mock_readSequenceFromSequenceRef;
const {generateSequenceRef, readSequenceFromSequenceRef} = seqRef;

describe('test of forkProject', ()=>{
  let user:IUserEssential;
  let project:IProject;
  beforeAll(async ()=>{
    await connectMemoryMongoDB();
    user = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@gmail.com',
      groups:['users'],
      name:'Test User',
    }
    // project = await Project.findOne({ctype:'source'}).exec();
    project = await prepareTestProject();
    console.log('project prepared? ', !!project);
  }, 10000);

  
  test('project saved into database', async ()=>{
    const result = await Project.findById(project._id).exec();
    expect(result).not.toBeUndefined();
    expect(result.name).toBe('test');
  });

  test('mocked project has sequence', async ()=>{
    let proj = await Project
    .findById(project._id)
    .populate({
      path:'parts',
    })
    .exec();

    const sequence = await readSequenceFromSequenceRef(proj.sequenceRef);
    expect(sequence).toBe('CCCCCCCCCCCCCCCCCCCCATGAAAGAAAAAATGACCCCCCCCCCCCCCCCCCCCCCCC');
    const sequence2 = await readSequenceFromSequenceRef((proj.parts[0].sequenceRef as any).toObject());
    expect(sequence2).toBe('ATGAAAGAAAAAATGA');
  });

  describe('fork a project', ()=>{
    let result;
    let forkedProject;
    beforeAll(async ()=>{
      result = await forkProject(user, project._id, 'new name');
      if (result) {
        forkedProject = await Project.findById(result._id).exec();
      }
    })
    test('has result', ()=>{
      expect(result).not.toBeUndefined();
      expect(result._id).not.toBeUndefined();
    });

    test('project forked and name should be the new one', ()=>{
      expect(forkedProject.name).toBe('new name');
      expect(['project', 'flatProject']).toContain(forkedProject.ctype);
      expect(forkedProject.owner._id.toString()).toBe(user._id.toString());
    })

    test('forked project must be newer', ()=>{
      expect(forkedProject.updatedAt.getTime()).toBeGreaterThan(project.updatedAt.getTime());
    });

    test('forked project should share the same parts', ()=>{
      expect(forkedProject.parts[0].toString()).toBe(project.parts[0].toString());
    })

    afterAll(async ()=>{
      await Project.deleteOne({_id:forkedProject._id}).exec();
    })
  });

  test('fork and delete project', async ()=> {
    let result = await forkProject(user, project._id);
    await hideProject(result._id);

    const hidedProject:IProject = await Project.findById(result._id).exec();
    expect(hidedProject.ctype).toBe('deletedProject');
    
    await Project.deleteOne({_id:result._id}).exec();
    await Project.deleteOne({_id:hidedProject._id}).exec();
  }, 10000);

  afterAll(async () => {
    // await AnnotationPart.remove({_id:project.parts[0]});
    // await Project.remove({_id:project._id});
    await stopMongoMemoryServer();
  }, 10000);
})
