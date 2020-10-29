// import request from 'supertest'
import mongoose from 'mongoose';
import {Project, AnnotationPart} from '../models';
import { connectMemoryMongoDB, stopMongoMemoryServer } from '../mongodb';
import {buildProjectSequenceRefFromParts} from './buildProjectSequenceRefFromParts'
import conf from '../conf';

// import io from 'socket.io-client';
import fs from 'fs';


const seqRef = require("../sequenceRef");
import {prepareTestProject, mock_generateSequenceRef, mock_readSequenceFromSequenceRef} from './test/prepareTestProject';
seqRef.generateSequenceRef = mock_generateSequenceRef;
seqRef.readSequenceFromSequenceRef = mock_readSequenceFromSequenceRef;
const {generateSequenceRef, readSequenceFromSequenceRef} = seqRef;


describe('test of buildProjectSequenceRefFromParts_worker', () => {
  let project:IProject;
  let project2:IProject;
  let project3:IProject;
  beforeAll(async ()=>{
    await connectMemoryMongoDB();
    project = await prepareTestProject({
      name:"test",
      projectId:"5e999fc99b3fbc8a5a000000",
      version:"0.1",
      parts:[{
        featureType:"gene",
        chrName:"chr01",
        chrId:0,
        start:20,
        end:36,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741","Name":"YAL003W","orf_classification":"Verified","gene":"EFB1","Alias":"EFB1,EF-1beta,eEF1Balpha,TEF5","dbxref":"SGD:S000000003","Note":"test gene"},
        name:"test gene",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'ATGAAAGAAAAAATGA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"CDS",
        chrName:"chr01",
        chrId:0,
        start:20,
        end:26,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741_CDS","Name":"YAL003W"},
        name:"test gene cds",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'ATGAAA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"intron",
        chrName:"chr01",
        chrId:0,
        start:26,
        end:30,
        strand:1,
        attribute:{},
        name:"test intron",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'GAAA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"CDS",
        chrName:"chr01",
        chrId:0,
        start:30,
        end:36,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741_CDS","Name":"YAL003W"},
        name:"test gene intron",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'AAATGA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      len:60,
      history:[],
      sequenceHash:"ef1be857fb0cd00473aa11b60dea3430",
      ctype:"source",
      changelog:"test project",
      createdAt: new Date(),
      updatedAt: new Date(),
      seqName:"chr01",
    });
    project2 = await prepareTestProject({
      name:"test",
      projectId:"5e999fc99b3fbc8a5a000000",
      version:"0.1",
      parts:[{
        featureType:"gene",
        chrName:"chr01",
        chrId:0,
        start:20,
        end:36,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741","Name":"YAL003W","orf_classification":"Verified","gene":"EFB1","Alias":"EFB1,EF-1beta,eEF1Balpha,TEF5","dbxref":"SGD:S000000003","Note":"test gene"},
        name:"test gene",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'ATGAAAGAAAAAATGA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"CDS",
        chrName:"chr01",
        chrId:0,
        start:20,
        end:26,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741_CDS","Name":"YAL003W"},
        name:"test gene cds",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'ATGAAA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"intron",
        chrName:"chr01",
        chrId:0,
        start:26,
        end:30,
        strand:1,
        attribute:{},
        name:"test intron",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'GAAA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      },{
        featureType:"CDS",
        chrName:"chr01",
        chrId:0,
        start:30,
        end:36,
        strand:1,
        attribute:{"ID":"YAL003W_BY4741_CDS","Name":"YAL003W"},
        name:"test gene intron",
        original:true,
        history:[],
        sequenceHash:"a4bcda462e0f63886e4f13446ed3615c",
        sequence: 'AAATGA',
        changelog:"test 1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }],
      len:60,
      history:[],
      sequenceHash:"ef1be857fb0cd00473aa11b60dea3430",
      sequence:"CCCCCCCCCCCCCCCCCCCCATGAAAGAAAAAATGACC",
      ctype:"source",
      changelog:"test project",
      createdAt: new Date(),
      updatedAt: new Date(),
      seqName:"chr01",
    });

    project3 = await prepareTestProject();
  }, 10000);

  test('build project sequence ref', async ()=>{
    expect(project.sequenceRef).toBeUndefined();
    const project2 = await buildProjectSequenceRefFromParts(project!._id);
    const sequence = await readSequenceFromSequenceRef(project2.sequenceRef);
    expect(sequence).toBe('NNNNNNNNNNNNNNNNNNNNATGAAAGAAAAAATGANNNNNNNNNNNNNNNNNNNNNNNN');
    expect(project2.history.length).toBe(1);
    expect(project2.history[0]._id.toString()).toBe(project._id.toString());
  }, 120000);

  test('build project sequence ref if some sequence exist', async ()=>{
    const project2d = await buildProjectSequenceRefFromParts(project2!._id);
    const sequence = await readSequenceFromSequenceRef(project2d.sequenceRef);
    expect(sequence).toBe('CCCCCCCCCCCCCCCCCCCCATGAAAGAAAAAATGACCNNNNNNNNNNNNNNNNNNNNNN');
    expect(project2d.history.length).toBe(1);
    expect(project2d.history[0]._id.toString()).toBe(project2._id.toString());
  }, 120000);

  test('build project sequence ref if some all sequence exist', async ()=>{
    const project3d = await buildProjectSequenceRefFromParts(project3!._id);
    const sequence = await readSequenceFromSequenceRef(project3d.sequenceRef);
    expect(sequence).toBe('CCCCCCCCCCCCCCCCCCCCATGAAAGAAAAAATGACCCCCCCCCCCCCCCCCCCCCCCC');
    expect(project3d.sequenceRef.fileName).toBe(project3.sequenceRef.fileName);
    expect(project3d.history.length).toBe(0);
  }, 120000);


  afterAll(async ()=>{
    await stopMongoMemoryServer();
  });
})
