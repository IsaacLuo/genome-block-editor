/// <reference path="@types/index.d.ts" />
import http from 'http';
import socket from "socket.io";
import TaskDict from './taskDict';
import gbeWorkerHost from './gbeWorkerHost';
import replaceCodon from './projectGlobalTasks/replaceCodon';
import createPromoterTerminator from './projectGlobalTasks/createPromoterTerminator';
import removeIntron from './projectGlobalTasks/removeIntron';


global.taskDict = new TaskDict();

export default function taskProcessorST(server:http.Server) {
  const io = socket(server);
  io.on('connection', async (socket)=>{
    console.log('connected /tasks');
    socket.on('startTask', async ({taskName, taskParams})=>{
      console.log('startTask ST', taskName);
      const taskId = global.taskDict.initialTask(taskName, taskParams);
      socket.join(taskId);
      const task = global.taskDict.getTask(taskId);
      task.state = 'running';
      task.startedAt = new Date();
      io.in(taskId).emit('state', task.state);
      io.of('/taskMonitor').emit('taskUpdate', task);
      let fn;
      switch (taskName) {
        case 'createPromoterTerminator':
          fn = createPromoterTerminator;
          break;
        case 'replaceCodon':
          fn = replaceCodon;
          break;
        case 'removeIntron':
          fn = removeIntron;
          break;
      
        default:
          console.error(`${task.program} is not a task`);
          io.in(taskId).emit('abort', `${task.program} is not a task`);
          socket.disconnect();
          return;
      }
      const newProject = await fn(task.params, (progress:number, message:string)=>{
        io.in(taskId).emit('progress', {progress, message});
        console.debug(`task ${taskName} progress ${progress} ${message} ${taskId}`);
      });
      const resultData = {newProjectId:newProject._id.toString()};
      io.in(taskId).emit('result', resultData);
      socket.disconnect();
    });
  });
} 