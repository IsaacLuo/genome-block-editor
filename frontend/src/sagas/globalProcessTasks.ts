import { HIDE_ALL_DIALOG } from './../actions';
import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import conf from '../conf.json'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import axios from 'axios';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import { InMemoryCache } from 'apollo-cache-inmemory';
import io from 'socket.io-client';

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

function generateSocketAction(serverAction:IAction):IAction {
  switch (serverAction.type) {
    case 'message':
        return {
          type: 'SERVER_MESSAGE',
          data: serverAction.data,
        };
    case 'progress':
        return{
          type: 'PROGRESS',
          data: serverAction.data,
        };
    case 'state':
      return {
        type: 'SET_PROCESS_STATE',
        data: serverAction.data,
      };
    case 'result':
      return {
        type: 'SERVER_RESULT',
        data: serverAction.data,
      };
    case 'stderr':
      return {
        type: 'SERVER_LOG',
        data: serverAction.data
      };
    case 'abort':
      return {
        type: 'ABORT_TASK',
        data: serverAction.data,
      };
    default:
      return {
        type: 'UNKOWN_SOCKET_ACTION', 
        data: serverAction.data,
      }
  }
}


function* replaceCodonTask(action:IAction) {
  try {
    const {id, rules} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/mapping_project/replace_codons/from/${id}`, {rules})
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
      const reduxAction = generateSocketAction(serverAction);
      yield put(reduxAction);
      if (serverAction.type === 'result') {
        break;
      }
    }
    
  } catch (err) {
    console.error(err);
  }

}

function* insertPartAfterFeature(action:IAction) {
  try {
    const {id, featureType, direct, offset, sequenceType, sequence} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/mapping_project/insert_parts_after_features/from/${id}`, {featureType, direct, offset, sequenceType, sequence})
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
      const reduxAction = generateSocketAction(serverAction);
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
    const {id, featureType, direct, offset, sequenceType, sequence} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/mapping_project/remove_intron/from/${id}`, {})
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
      const reduxAction = generateSocketAction(serverAction);
      yield put(reduxAction);
      if (serverAction.type === 'result') {
        break;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

export default function* watchGlobalProcessTasks() {
  yield takeLatest('REPLACE_CODON_TASK', replaceCodonTask);
  yield takeLatest('INSERT_PART_AFTER_FEATURE', insertPartAfterFeature);
  yield takeLatest('START_REMOVE_INTRON_TASK', startRemoveIntronTask);
}


