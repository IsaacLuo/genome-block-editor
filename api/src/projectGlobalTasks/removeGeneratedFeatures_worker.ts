/// <reference path="../@types/index.d.ts" />
const { parentPort } = require("worker_threads");

function sleep(ms:number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// receive from main thread
parentPort.on("message", buf => {
  // post to main thread
  parentPort.postMessage(buf+'_hahah');
});