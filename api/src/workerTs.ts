import { Worker, WorkerOptions } from "worker_threads";

const workerTs = (filename: string, wkOpts: WorkerOptions) => {
  if (/\.js$/.test(__filename)) {
    return new Worker(`${filename}.js`, wkOpts);
  } else {
    wkOpts.eval = true;
    if (!wkOpts.workerData) {
        wkOpts.workerData = {};
    }
    const file = `${filename}.ts`;
    wkOpts.workerData.__filename = file;
    return new Worker(`
            const wk = require('worker_threads');
            require('ts-node').register();
            let file = wk.workerData.__filename;
            delete wk.workerData.__filename;
            require(file);
        `,
        wkOpts
    );
  }
}

export default workerTs;