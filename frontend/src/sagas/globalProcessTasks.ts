import { HIDE_ALL_DIALOG, LOAD_SOURCE_FILE } from './../actions';
import {call, select, all, fork, put, take, takeLatest, takeEvery, takeLeading} from 'redux-saga/effects'
import conf from '../conf.json'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import axios from 'axios';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import { InMemoryCache } from 'apollo-cache-inmemory';
import io from 'socket.io-client';
import { notification } from 'antd';

function monitorSocket(socket:SocketIOClient.Socket) {
  return eventChannel( emitter => {
    const types = ['message', 'progress', 'state', 'result', 'stderr', 'abort'];
    types.forEach(type=>{
      socket.on(type,(data:any)=>{
        emitter({type, data});
      })
    })
    return () => {
      console.log('Socket off')
    }
  });
}

function generateSocketAction(serverAction:IAction, extraPayload?:any):IAction {
  switch (serverAction.type) {
    case 'message':
        return {
          type: 'SERVER_MESSAGE',
          data: serverAction.data,
          payload: extraPayload,
        };
    case 'progress':
        return{
          type: 'PROGRESS',
          data: serverAction.data,
          payload: extraPayload,
        };
    case 'state':
      return {
        type: 'SET_PROCESS_STATE',
        data: serverAction.data,
        payload: extraPayload,
      };
    case 'result':
      return {
        type: 'SERVER_RESULT',
        data: serverAction.data,
        payload: extraPayload,
      };
    case 'stderr':
      return {
        type: 'SERVER_LOG',
        data: serverAction.data,
        payload: extraPayload,
      };
    case 'abort':
      return {
        type: 'ABORT_TASK',
        data: serverAction.data,
        payload: extraPayload,
      };
    default:
      return {
        type: 'UNKOWN_SOCKET_ACTION', 
        data: serverAction.data,
        payload: extraPayload,
      }
  }
}


function* replaceCodonTaskHttp(action:IAction) {
  try {
    const {id, rules, selectedRange} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/mapping_project/replace_codons/from/${id}`, {rules, selectedRange})
    const {taskInfo} = result.data;
    // console.log(taskInfo);
    const {processId, serverURL} = taskInfo;

    // 2. use socket.io
    const socket = io(serverURL);
    const channel = yield call(monitorSocket, socket);
    socket.emit('startTask', processId, ()=>{})
    while (true) {
      const serverAction = yield take(channel)
      // console.debug('messageType', serverAction.type)
      console.log(serverAction);
      const reduxAction = generateSocketAction(serverAction, {_id:id, selectedRange});
      yield put(reduxAction);
      if (serverAction.type === 'result') {
        break;
      }
    }
    
  } catch (err) {
    console.error(err);
  }
}

export function* replaceCodonTask(action:IAction) {
  try {
    const {id, rules, selectedRange} = action.data;
    // use socket.io
    const socket = io(conf.backendURL);
    const channel = yield call(monitorSocket, socket);
    socket.emit('startTask', {taskName: 'replaceCodon', taskParams: {_id:id, rules:rules.split(' '), selectedRange}});
    while (true) {
      const serverAction = yield take(channel);
      if (serverAction.type === 'result') {
        yield put({type:LOAD_SOURCE_FILE, data: serverAction.data.newProjectId});
        yield call(notification.success, {
          message: 'success',
          description:
            'codon are created',
        });        
        break;
      } else {
        const reduxAction = yield call(generateSocketAction, serverAction);
        yield put(reduxAction);
      }
    }
    
  } catch (error) {
    yield call(notification.error, {message:error});
  }
}


function* insertPartAfterFeature(action:IAction) {
  try {
    const {id, featureType, direct, offset, sequenceType, sequence, selectedRange} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/mapping_project/insert_parts_after_features/from/${id}`, {featureType, direct, offset, sequenceType, sequence, selectedRange})
    const {taskInfo} = result.data;
    // console.log(taskInfo);
    const {processId, serverURL} = taskInfo;

    // 2. use socket.io
    const socket = io(serverURL);
    const channel = yield call(monitorSocket, socket);
    socket.emit('startTask', processId, ()=>{})
    while (true) {
      const serverAction = yield take(channel)
      // console.debug('messageType', serverAction.type)
      console.log(serverAction);
      const reduxAction = generateSocketAction(serverAction, {_id:id, selectedRange});
      yield put(reduxAction);
      if (serverAction.type === 'result') {
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

function* startRemoveIntronTask(action:IAction) {
  try {
    const {id, intronTypes, selectedRange} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/mapping_project/remove_introns/from/${id}`, {intronTypes, selectedRange})
    const {taskInfo} = result.data;
    // console.log(taskInfo);
    const {processId, serverURL} = taskInfo;

    // 2. use socket.io
    const socket = io(serverURL);
    const channel = yield call(monitorSocket, socket);
    socket.emit('startTask', processId, ()=>{})
    while (true) {
      const serverAction = yield take(channel)
      console.log(serverAction);
      const reduxAction = generateSocketAction(serverAction, {_id:id, selectedRange});
      yield put(reduxAction);
      if (serverAction.type === 'result') {
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export function* sequenceEdit(action:IAction) {
  
}

// let lastTimer = Date.now();

// export function* setProgress(action:IAction) {
//   // set timer, only send 'PROGRESS' every 1 second
//   const now = Date.now();
//   // if(lastTimer)
//   // lastTimer = now;
//   yield put({type:'SET_PROGRESS', data:action.data});
//   console.log('saga_progress', action.data.progress);
//   yield delay(1000);
// }

export default function* watchGlobalProcessTasks() {
  yield takeLatest('REPLACE_CODON_TASK', replaceCodonTask);
  yield takeLatest('INSERT_PART_AFTER_FEATURE', insertPartAfterFeature);
  yield takeLatest('START_REMOVE_INTRON_TASK', startRemoveIntronTask);
  yield takeEvery('SEQUENCE_EDIT', sequenceEdit);
  // yield takeLeading('PROGRESS', setProgress);
}


