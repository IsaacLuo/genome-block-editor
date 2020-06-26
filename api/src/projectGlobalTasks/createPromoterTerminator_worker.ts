/// <reference path="../@types/index.d.ts" />
import createPromoterTerminator from './createPromoterTerminator';
// const taskWorker = require('./taskWorker');
import taskWorker from './taskWorker';
console.log('> worker started createPromoterTerminator');
const startTime = Date.now();
taskWorker(createPromoterTerminator).then(()=>{
  console.log('worker exit. time=', Date.now()-startTime);
})