/// <reference path="@types/index.d.ts" />
import http from 'http';
import socket from "socket.io";
import TaskDict from './taskDict';
import gbeWorkerHost from './gbeWorkerHost';

declare global {
  namespace NodeJS {
    interface Global {
      taskDict: TaskDict;
    }
  }
}
global.taskDict = new TaskDict();


/**
 * run tasks using node.js workers for production, may not suit for debugging
 * @socket.io.param taskName: the task name need to be called, see the switch blcok
 * @socket.io.param taskParams: the parameter of the task, varies in different tasks
 * @param server the http.server object
 */
export default function taskProcessor(server:http.Server) {
  const io = socket(server, {transports: ['websocket']});
  io.origins('*:*');
  io.on('connection', async (socket)=>{
    console.log('connected /tasks');
    socket.on('startTask', async ({taskName, taskParams})=>{
      console.log('startTask', taskName);
      const taskId = global.taskDict.initialTask(taskName, taskParams);
      socket.join(taskId);
      const task = global.taskDict.getTask(taskId);
      if(!task) {
        console.error('no such task');
        socket.disconnect();
        return;
      }
      task.state = 'running';
      task.startedAt = new Date();
      io.in(taskId).emit('state', task.state);
      io.of('/taskMonitor').emit('taskUpdate', task);
      try {
        const resultData = await gbeWorkerHost(task.program, task.params, (progress:number, message:string)=>{
          io.in(taskId).emit('progress', {progress, message});
        });
        task.state = 'done';
        task.doneAt = new Date();
        console.log('task done', resultData);
        io.in(taskId).emit('progress', {progress:100, message:'finish'});
        io.in(taskId).emit('state', task.state);
        io.in(taskId).emit('result', resultData);
        io.of('/taskMonitor').emit('taskUpdate', task);
      } catch (err) {
        console.log(err);
        task.state = 'aborted';
        io.in(taskId).emit('abort', task.state);
      }
      socket.disconnect();
    });

    socket.on('abort', async(processId)=>{
      const task = global.taskDict.getTask(processId);
      if(!task) {
        socket.disconnect();
        return;
      }
      task.state='aborted';
      io.of('/taskMonitor').emit('taskUpdate', task);
      socket.leave(processId);
    })

    socket.on('disconnect', async (reason)=>{
      console.log('socket disconnected');
    });

    socket.on('attachProcess', async (processId)=>{
      socket.join(processId);
    });

  })

  io.of('/taskMonitor').on('connection', async (socket)=>{
    socket.on('getTasks', async (callback)=>{
      const tasks = global.taskDict.getAllTasks();
      callback(tasks);
    });

    socket.on('attachProcess', async (processId)=>{
      socket.join(processId);
    });

  })

}

