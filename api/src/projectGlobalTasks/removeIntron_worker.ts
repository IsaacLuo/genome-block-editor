/// <reference path="../@types/index.d.ts" />
import removeIntron from './removeIntron';
import taskWorker from './taskWorker';
console.log('> worker started removeIntron');
const startTime = Date.now();
taskWorker(removeIntron).then(()=>{
  console.log('worker exit. time=', Date.now()-startTime);
})