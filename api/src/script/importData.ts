/// <reference path="../@types/index.d.ts" />
import conf from '../../conf'
import fs from 'fs'

import * as childProcess from 'child_process'

const readline = require('readline');

export function runExe (
  process:any,
  dataIn?: any, 
  onOutput?: (outputObj:any, stdin?:any)=>void, 
  onStdErr?: (message: string)=>void,
  onProcessCreated?: (instance:childProcess.ChildProcessWithoutNullStreams)=>void,
  ) {
  return new Promise((resolve, reject)=>{
    const subProcess = childProcess.spawn(process.program, process.params);
    if (onProcessCreated) {
      onProcessCreated(subProcess);
    }
    const rl = readline.createInterface({
      input: subProcess.stdout,
    });

    // const allObjects:any[] = [];
    
    rl.on('line', input => {
      console.log('debug: ', input);
      // const messageObj = JSON.parse(input.toString());
      // if(onOutput) {
        // onOutput(messageObj, subProcess.stdin);
      // }
    })

    subProcess.stderr.on('data', (data) => {
      console.log('data:', data);
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
      subProcess.stdin.write(JSON.stringify(dataIn));
    }

  });
}

async function main() {
  fs.writeFileSync('./utility/conf.json', JSON.stringify(conf,null, 4));
  // exec('pipenv run python import_data.py');
  await runExe({program: 'pipenv', params: ['run', 'python', 'import_data.py']})
  console.log('done');
}

main().then(()=>process.exit());