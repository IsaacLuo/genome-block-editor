import * as childProcess from 'child_process'
import readline from 'readline'

export function runExe (
  process: IExeProcess, 
  dataIn?: any, 
  onOutput?: (outputObj:any, stdin?:any)=>void, 
  onStdErr?: (message: string)=>void,
  onProcessCreated?: (instance:childProcess.ChildProcessWithoutNullStreams)=>void,
  ) {
  return new Promise((resolve, reject)=>{
    console.debug('start',process.program,  process.params);
    const subProcess = childProcess.spawn(process.program, process.params, process.options);
    if (onProcessCreated) {
      onProcessCreated(subProcess);
    }
    const rl = readline.createInterface({
      input: subProcess.stdout,
    });

    // const allObjects:any[] = [];
    
    rl.on('line', input => {
      // console.log('debug: ', input);
      // const messageObj = (typeof(input) === 'string') ? JSON.parse(input) : input;
      const messageObj = JSON.parse(input.toString());
      if(onOutput) {
        onOutput(messageObj, subProcess.stdin);
      }
    })

    subProcess.stderr.on('data', (data) => {
      // console.log(data);
      if (onStdErr) {
        onStdErr(data.toString());
      }
    });
    
    subProcess.on('close', (code) => {
      // console.debug('finish python', code);
      if (code === 0) {
        // resolve(allObjects);
        resolve(0);
      } else {
        // reject({code, output:allObjects});
        reject(code);
      }
    });

    if (dataIn) {
      subProcess.stdin.write(JSON.stringify(dataIn)+'\n');
    }

  });
}