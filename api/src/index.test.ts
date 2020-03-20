import app from './index'
import request from 'supertest'
describe('test index', ()=>{
  it('server is running', async ()=>{
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual({message:'OK'});
  })

  it('should error', async ()=>{
    expect(2).toBe(2);
  })
})
