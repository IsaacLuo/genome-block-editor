import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import conf from '../conf'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'

import Axios from 'axios';

function* heartBeat(action: IAction) {
  const ws = action.data;
  yield call(delay, 30000);
  if(ws && ws.readyState === 1) {
    ws.send(JSON.stringify({type:'heartbeat'}));
  }
  yield put({type:'HEARTBEAT'});
}


function initWebSocket(ws:WebSocket) {
  return eventChannel( emitter => {
    ws.onmessage = event => {
      console.debug('server ws: '+ event.data);
      try {
        const serverAction = JSON.parse(event.data);
        emitter(serverAction);
      } catch (err) {
        console.error(event.data);
      }
    }
    ws.onopen = () => {
      console.log('websocket open');
    }

    ws.onclose = () => {
      console.log('websocket closed');
      emitter({type:'WS_DISCONNECTED'});
    }

    return () => {
      console.log('Socket off')
    }
  });
}

function* startTask(action:IAction) {
  const pageState:IGeneralTaskState = yield select((state:IStoreState) =>state.generalTask);
  const {taskUrl, params} = action.data;
  try {
    // 1. call API to create a task
    const newTaskContent = yield call(Axios.post, taskUrl, {params}, {withCredentials: true});
    const {processId} = newTaskContent.data;
    yield put({type:'SET_PROCESS_ID', data:processId});

    // 2. create websocket to receive progress
    const webSocket = new WebSocket(taskUrl);
    const channel = yield call(initWebSocket, webSocket);
    yield put({type:'SET_WS', data: webSocket});
    // yield put({type:HEARTBEAT, data:webSocket});
    while (true) {
      const serverAction = yield take(channel)
      console.debug('messageType', serverAction.type)
      switch (serverAction.type) {
        case 'signal':
          yield put({
            type: 'SET_PROCESS_SIGNAL',
            data: serverAction.message,
          });
          break;

        case 'progress':
            yield put({
              type: 'PROGRESS',
              data: {message: serverAction.message, progress:Math.ceil(serverAction.progress*100)},
            });
            yield put({
              type: 'SET_PROCESS_SIGNAL',
              data: serverAction.message,
            });
            break;

        case 'log':
            yield put({
              type: 'SET_PROCESS_LOG',
              data: serverAction.message,
            });
            break;

        case 'result':
            yield put({
              type: 'SERVER_RESULT',
              data: serverAction.data,
            });
            yield put({
              type: 'SET_PROCESS_LOG',
              data: serverAction.message,
            });
            break;

        case 'initialize':
          yield put({
              type: 'SET_CLIENT_ID',
              data: serverAction.data.clientId,
            });
            break;
        case 'prompt':
          yield put({
              type: 'PROGRESS',
              data: {message: 'started', progress:0},
            });
          break;
        case 'queueing':
          yield put({
            type: 'SERVER_MESSAGE',
            data: {message: serverAction.message},
          });
          break;
        

        case 'finish':
          yield put({
            type: 'FINISH_TASK',
          });
          break;
        case 'rejected':
          yield put({
            type: 'REJECT_TASK',
            data: {message: serverAction.message},
          });
          break;
        case 'message':
          yield put({
            type: 'SERVER_MESSAGE',
            data: {message: serverAction.message},
          });
          break;
      }
    }
  } catch (err) {

  }

}

function* attachTask(action:IAction) {
  const {taskUrl} = action.data;
  try {
    // 2. create websocket to receive progress
    const webSocket = new WebSocket(taskUrl);
    const channel = yield call(initWebSocket, webSocket);
    yield put({type:'SET_WS', data: webSocket});
    // yield put({type:HEARTBEAT, data:webSocket});
    while (true) {
      const serverAction = yield take(channel)
      console.debug('messageType', serverAction.type)
      switch (serverAction.type) {
        case 'signal':
          yield put({
            type: 'SET_PROCESS_SIGNAL',
            data: serverAction.message,
          });
          break;

        case 'progress':
            yield put({
              type: 'PROGRESS',
              data: {message: serverAction.message, progress:Math.ceil(serverAction.progress*100)},
            });
            yield put({
              type: 'SET_PROCESS_SIGNAL',
              data: serverAction.message,
            });
            break;

        case 'log':
            yield put({
              type: 'SET_PROCESS_LOG',
              data: serverAction.message,
            });
            break;

        case 'result':
            yield put({
              type: 'SERVER_RESULT',
              data: serverAction.data,
            });
            yield put({
              type: 'SET_PROCESS_LOG',
              data: serverAction.message,
            });
            break;

        case 'initialize':
          yield put({
              type: 'SET_CLIENT_ID',
              data: serverAction.data.clientId,
            });
            break;
        case 'prompt':
          yield put({
              type: 'PROGRESS',
              data: {message: 'started', progress:0},
            });
          break;
        case 'queueing':
          yield put({
            type: 'SERVER_MESSAGE',
            data: {message: serverAction.message},
          });
          break;
        

        case 'finish':
          yield put({
            type: 'FINISH_TASK',
          });
          break;
        case 'rejected':
          yield put({
            type: 'REJECT_TASK',
            data: {message: serverAction.message},
          });
          break;
        case 'message':
          yield put({
            type: 'SERVER_MESSAGE',
            data: {message: serverAction.message},
          });
          break;
      }
    }
  } catch (err) {

  }
}

function* onWebsocketDisconnected() {
  yield call(delay, 10000);
  yield put({type:'CREATE_WS'});
}

function* abortTask(action:IAction) {
  try {
    yield call(Axios.delete, action.data.taskUrl, {withCredentials: true});
  } catch (err) {

  }
  return;
}

function* rejectTask(action:IAction) {
  yield(console.error, action.data.message);
}


export default function* watchWebExe() {
  yield takeEvery('START_TASK', startTask);
  yield takeEvery('ATTACH_TASK', attachTask);
  yield takeEvery('REJECT_TASK', rejectTask);
  yield takeEvery('ABORT_TASK', abortTask);
  yield takeLatest('WS_DISCONNECTED', onWebsocketDisconnected);
  yield takeEvery('HEARTBEAT', heartBeat);
  
}
