import {updateProjectByGFFJSON, projectToGFFJSONPartial} from './projectImportExport'
import request from 'supertest'
import mongoose from 'mongoose';
import {Project} from '../models';
import { connectMemoryMongoDB, stopMongoMemoryServer } from '../mongodb';

import {prepareTestProject, mock_generateSequenceRef, mock_readSequenceFromSequenceRef} from './test/prepareTestProject';
const seqRef = require("../sequenceRef");
seqRef.generateSequenceRef = mock_generateSequenceRef;
seqRef.readSequenceFromSequenceRef = mock_readSequenceFromSequenceRef;
const {generateSequenceRef, readSequenceFromSequenceRef} = seqRef;

describe('test of projecttoGFFJSON', ()=>{
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
      },
      {
        featureType:"gene",
        chrName:"chr01",
        chrId:0,
        start:60,
        end:70,
        strand:-1,
        attribute:{"ID":"test2","Name":"test2"},
        name:"test gene2",
        original:true,
        history:[],
        sequenceHash:"cc5dd36cda159ad533826a3c2ccbd33d",
        sequence: 'ATGCCCTGA',
        changelog:"test 2",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ],
      len:72,
      history:[],
      sequenceHash:"e98b5108af534d9fde9d37203ea48b58",
      sequence:'CCCCCCCCCCCCCCCCCCCCATGAAAGAAAAAATGACCCCCCCCCCCCCCCCCCCCCCCCTCAGGGCATGGG',
      ctype:"source",
      changelog:"test project",
      createdAt: new Date(),
      updatedAt: new Date(),
      seqName:"chr01",
    });

    console.log(project._id);

  }, 10000);

  test('exatct only gene2', async ()=>{
    expect(project).not.toBe(undefined);

    const gffJson = await projectToGFFJSONPartial(project._id, {start: 50, end:70});
    expect(gffJson.records.length).toBe(1);
  });
  afterAll(async ()=>{
    stopMongoMemoryServer();
  })
})