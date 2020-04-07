import app from './index'
import request from 'supertest'
import mongoose from 'mongoose';
import {Project} from './models';
import connectMongoDB from './mongodb';

describe('test index', ()=>{
  it('server is running', async ()=>{
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({message:'OK'});
  })

  it('should error', async ()=>{
    expect(2).toBe(2);
  })

  test('date format should be correct', async () => {
    const date = new Date();
    const project = await Project.create({createdAt:date});
    console.log(project);
    expect(project.createdAt.getTime()).toBe(date.getTime());
    // expect(2).toBe(3);
  }, 10000)
})
