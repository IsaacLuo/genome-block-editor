// import request from 'supertest'
import mongoose from 'mongoose';
import {Project, AnnotationPart} from '../models';
import connectMongoDB from '../mongodb';
import {buildProjectSequenceRefFromParts} from './buildProjectSequenceRefFromParts'
import conf from '../conf';

// import io from 'socket.io-client';
import fs from 'fs';
import { readSequenceFromSequenceRef } from './projectImportExport';

jest.mock(readSequenceFromSequenceRef)

describe('test of buildProjectSequenceRefFromParts_worker', () => {
  let user:IUserEssential;
  let project:IProject;
  const projectId='00000b23b271eec71aa079d1';
  let parts = [];
  beforeAll(async ()=>{
    await connectMongoDB();
    user = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@gmail.com',
      groups:['users'],
      name:'Test User',
    }

    fs.writeFileSync(`${conf.rootStorageFolder}/sequences/test`, 'CAAAAATTTTTG');
    parts = [];
    parts.push(await AnnotationPart.create({
      "featureType":"gene",
      "chrName":"chr01",
      "chrId":0,
      "start":10,
      "end":20,
      "strand":1,
      "original":false,
      "history":[],
      "sequenceRef":{
        "fileName":"test",
        "start":1,
        "end":11,
        "strand":1,
        "changelog":"test1",
        "createdAt":new Date(),
        "updatedAt":new Date(),
      }
    }))

    project = await Project.create({
      "name":"test_project",
      "projectId":projectId,
      "version":"0.1",
      "parts":parts.map(v=>v._id),
      "len":30,
      "history":[],
      "sequenceHash":"ef1be857fb0cd00473aa11b60dea3430",
      "ctype":"project",
      "changelog":"test",
      "createdAt":new Date(),
      "updatedAt":new Date(),
      "seqName":"test01",
    })
    // console.log(project);
    console.log('project prepared? ', !!project);
  }, 10000);

  test('start build project sequence ref', async ()=>{
    const project2 = await buildProjectSequenceRefFromParts(project!._id);
    const sequence = await readSequenceFromSequenceRef(project2.sequenceRef);
    expect(sequence).toEqual('NNNNNNNNNNAAAAATTTTTNNNNNNNNNN');
    expect(project2.history.length).toBe(1);
    expect(project2.history[0]._id.toString()).toBe(project._id.toString());
  }, 120000);

  afterAll(async ()=>{
    const projectsToBeDeleted = await Project.find({projectId,}).select('sequenceHash').exec();
    const sequenceFileSet = new Set();
    for(const project of projectsToBeDeleted) {
      sequenceFileSet.add(project.sequenceRef.fileName);
    }
    for(const part of parts) {
      sequenceFileSet.add(part.sequenceRef.fileName);
    }
    // delete all parts
    await AnnotationPart.remove({_id:{$in:parts.map(v=>v._id)}});
    await Project.remove({projectId});
    sequenceFileSet.forEach(async (fileName)=>await fs.promises.unlink(`${conf.rootStorageFolder}/sequences/${fileName}`));
  })
})
