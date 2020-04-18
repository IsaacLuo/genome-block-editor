import {reverseComplement, testA} from './sequenceRef';
import * as sequenceRef from './sequenceRef';
import * as testB from './testB';
import request from 'supertest'
import mongoose from 'mongoose';

describe('test sequenceRef', ()=>{
  let user:IUserEssential;
  let project:IProject;
  beforeAll(async ()=>{
  });

  test('test reverseComplement', async ()=>{
      expect(reverseComplement('ATCGatcg')).toBe('cgatCGAT');
  });
})
