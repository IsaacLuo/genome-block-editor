
// redux saga
import { eventChannel } from 'redux-saga'
import {call, all, fork, put, take, takeLatest, select, actionChannel, takeEvery} from 'redux-saga/effects';

import watchWebExe from './sagas/webexe';

// other libs
import axios from 'axios';
import conf from './conf.json';
import { notification } from 'antd';
import io from 'socket.io-client';

export function* cailabInstanceLogin(action: IAction) {
  try {
    yield call(axios.post, conf.backendURL + '/api/session', {}, {withCredentials: true});
    yield put({type: 'GET_CURRENT_USER', data: undefined});
  } catch (error) {
  }
}

export function* getCurrentUser(action: IAction) {
  try {
    if (conf.localMode) {
      return;
    }
    const res = yield call(axios.get, conf.authServerURL + '/api/user/current', {withCredentials: true});
    const currentUser: IUserInfo = yield select((state: IStoreState) => state.app.currentUser);
    yield put({type: 'SET_CURRENT_USER', data: res.data.user});
  } catch (error) {
    yield put({type: 'SET_CURRENT_USER', data: {
      _id: '',
      fullName: 'guest',
      groups: ['guest'],
    }});
  }
}

export function* logout(action: IAction) {
  try {
    yield call(axios.delete, conf.authServerURL + '/api/session', {withCredentials: true});
    yield put({type: 'LOGOUT_DONE'});
  } catch (error) {
    console.warn('unable to logout');
  }
}

export function* watchUsers() {
  yield takeLatest('CAILAB_INSTANCE_LOGIN', cailabInstanceLogin);
  yield takeLatest('GET_CURRENT_USER', getCurrentUser);
  yield takeLatest('LOGOUT', logout);
}

export function* loadSourceFile(action:IAction) {
  try {
    const result = yield call(axios.get, `${conf.backendURL}/api/sourceFile/${action.data}`, {withCredentials: true});
    yield put({type: 'SET_SOURCE_FILE', data:result.data});
    yield put({type: 'HIDE_FORK_ALL_DIALOG', data:result.data});
  } catch (error) {
    console.warn('unable to logout');
  }
}

export function* forkProject(action: IAction) {
  try {
    const {id, name} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/project/forkedFrom/${id}?name=${name}`, {}, {withCredentials: true});
    const {_id} = result.data;
    yield put({type: 'LOAD_SOURCE_FILE', data:_id});
  } catch (error) {
    console.warn('unable to logout');
  }
}
export function* deleteProject(action: IAction) {
  try {
    const id = action.data;
    const result = yield call(axios.delete, `${conf.backendURL}/api/project/${action.data}`, {withCredentials: true});
    const {_id} = result.data;
    yield put({type: 'LOAD_SOURCE_FILE', data:_id});
  } catch (error) {
    console.warn('unable to logout');
  }
}

const sockets:any = {};

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

export function* removeCreatedFeatures (aciton:IAction) {
  // 1. call api to start webexe process at back-end
  try {
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const result = yield call(
      axios.put, 
      `${conf.backendURL}/api/globalTasks/removeGeneratedFeatures/${id}`, 
      {}, 
      {withCredentials: true});
    const {taskInfo} = result.data;
    console.log(taskInfo);
    const {processId, serverURL} = taskInfo;

    // 2. use socket.io
    const socket = io(serverURL);
    sockets[processId] = socket;
    const channel = yield call(monitorSocket, socket);

    socket.emit('startTask',processId, ()=>{})

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
  } catch (error) {
    yield call(notification.error, {message:error.toString()});
  }
}

function* handleServerResult(action:IAction) {
  // got server results send to backend
  const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
  const newTaskContent = yield call(axios.put, `${conf.backendURL}/api/project/${id}/fromFileUrl`, {fileUrl:action.data.files[0]}, {withCredentials: true});
}



export function* createPromoterTerminator(aciton:IAction) {
  // 1. call api to start webexe process at back-end
  try {
    console.log('createPromoterTerminator')
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const {promoterLength, terminatorLength} = aciton.data;
    const result = yield call(
      axios.put, 
      `${conf.backendURL}/api/mapping_project/gen_pro_ter/from/${id}`, 
      {
        promoterLength, 
        terminatorLength,
      }, {withCredentials: true});
    const {taskInfo} = result.data;
    console.log(taskInfo);
    const {processId, serverURL} = taskInfo;

    // 2. use socket.io
    const socket = io(serverURL);
    sockets[processId] = socket;
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
  } catch (error) {
    yield call(notification.error, {message:error});
  }
}

export function* watchGenomeOperations() {
  yield takeLatest('LOAD_SOURCE_FILE', loadSourceFile);
  yield takeLatest('FORK_PROJECT', forkProject);
  yield takeLatest('CREATE_PROMOTER_TERMINATOR', createPromoterTerminator);
  yield takeEvery('SERVER_RESULT', handleServerResult);
  yield takeLatest('REMOVE_CREATED_FEATURES', removeCreatedFeatures);
  yield takeLatest('DELETE_PROJECT', deleteProject);
}

export default function* rootSaga() {
  yield all([
    fork(watchUsers),
    fork(watchGenomeOperations),
    // fork(watchWebExe),
  ]);
}
