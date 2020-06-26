import workerTs from "./workerTs";

export default async function gbeWorkerHost(
                                        scriptPath:string,
                                        taskParams:any = {},
                                        onProgress?:(progress:number, message:string)=>void,
                                        workerOpt:any = {},
  ):Promise<any> {
  return (new Promise((resolve, reject)=>{
    if (onProgress) onProgress(0, 'creating task');
    const worker = workerTs(scriptPath, workerOpt);
    worker.on("message", ({type, data}) => {
      console.debug('received from worker', type, data);
      switch(type) {
        case 'progress':
          if (onProgress) onProgress(data.progress, data.message);
          break;
        case 'result':
          resolve(data);
          break;
        case 'error':
        case 'abort':
          reject(data);
          break;
      }
    });
    worker.postMessage({type:'startTask', data:taskParams});
  }))
}