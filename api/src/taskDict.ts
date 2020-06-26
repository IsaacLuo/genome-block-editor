/// <reference path="@types/index.d.ts" />
import path from 'path';
// import uuid from 'uuid';
const uuid = require('uuid');

const getProgramWorkerPath = (taskName:string) => {
  return path.resolve(__dirname, `projectGlobalTasks/${taskName}_worker`);
}

export default class TaskDict {
  private tasks:IProcessDict = {};
  
  constructor() {
  }

  public initialTask(taskName:string, taskParams:any, comments?:any, taskDataIn?:any, ) {
    let processId;
    do {
      processId = uuid.v1();
    } while(this.tasks[processId]!==undefined);
    
    this.tasks[processId] = {
      processId,
      program: getProgramWorkerPath(taskName),
      params: taskParams,
      dataIn: taskDataIn,
      comments,
      taskName,
      state: 'ready',
      result: undefined,
      createdAt: new Date(),
    }
    return processId;
  }

  public getTask(processId) {
    return this.tasks[processId];
  }

  public getAllTasks() {
    return this.tasks;
  }

  public removeOldTasks() {
    const processIds = Object.keys(this.tasks);
    processIds.forEach(processId => {
      const process = this.tasks[processId];
      if (process && process.createdAt && process.createdAt.getTime() < Date.now() - 3600000) {

        delete this.tasks[processId];
      }
    });
  }

}