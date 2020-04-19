import {reverseComplement} from './sequenceRef';

describe('test sequenceRef', ()=>{
  let user:IUserEssential;
  let project:IProject;
  beforeAll(async ()=>{
  });

  test('test reverseComplement', async ()=>{
      expect(reverseComplement('ATCGatcg')).toBe('cgatCGAT');
  });
})
