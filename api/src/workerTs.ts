import { Worker, WorkerOptions } from "worker_threads";

const workerTs = (filename: string, wkOpts: WorkerOptions) => {
  if (/\.js$/.test(__filename)) {
    return new Worker(`${filename}.js`, wkOpts);
  } else {
    wkOpts.eval = true;
    if (!wkOpts.workerData) {
        wkOpts.workerData = {};
    }
    let file = `${filename}.ts`;
    file = file.replace(/\\/g, '/');
    console.debug(file);
    // wkOpts.workerData.__filename = file;
    return new Worker(`
    require('ts-node').register();
    require('${file}');
    `, wkOpts);
  }
}

export default workerTs;
/*
return new Worker(`
            const wk = require('worker_threads');
            require('ts-node').register();
            let file = wk.workerData.__filename;
            console.log(file);
            delete wk.workerData.__filename;
            require(file);
        `,
        wkOpts
    ); //*/