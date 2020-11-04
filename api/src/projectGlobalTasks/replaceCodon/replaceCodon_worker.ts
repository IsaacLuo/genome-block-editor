/// <reference path="../@types/index.d.ts" />
import replaceCodon from './replaceCodon';
// const taskWorker = require('./taskWorker');
import taskWorker from './taskWorker';
console.log('> worker started replaceCodon');
const startTime = Date.now();
taskWorker(replaceCodon).then(()=>{
  console.log('worker exit. time=', Date.now()-startTime);
})