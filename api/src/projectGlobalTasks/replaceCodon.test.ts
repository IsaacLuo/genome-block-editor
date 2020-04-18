import {replaceCodon} from './replaceCodon'
import request from 'supertest'
import mongoose from 'mongoose';
import {Project} from '../models';
import connectMongoDB from '../mongodb';

import io from 'socket.io-client';

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

    // project = await Project.findOne({ctype:'project'}).exec();
    
    // console.log(project);
    console.log('project prepared? ', !!project);
  }, 10000);

  test('start replace codon task', async ()=>{
    const result = await replaceCodon(user, project._id, "TAG:TAA TGA:TAA", "");
    console.log(result);
    expect(result).not.toBeUndefined();
    expect(result).toHaveProperty('taskInfo');
    expect(result.taskInfo).toHaveProperty('processId');
    expect(result.taskInfo).toHaveProperty('serverURL');
    const {processId, serverURL} = result.taskInfo;

    // 2. use socket.io
    const socket = io(serverURL);
    await new Promise(resolve=>{
      // const types = ['message', 'progress', 'state', 'result', 'stderr', 'abort'];
      const gneratedResult = jest.fn();
      // types.forEach(type=>{
        socket.on('result',(data:any)=>{
          console.log('received result', data);
          gneratedResult();
        })
      // })
      socket.emit('startTask', processId, (data)=>{
        expect(gneratedResult).toHaveBeenCalled();
        resolve();
      });
    });

    socket.disconnect();
  }, 30000);
})
