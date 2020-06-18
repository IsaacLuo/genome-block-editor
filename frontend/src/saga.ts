import { LOAD_SOURCE_FILE_BY_PROJECT_ID } from './actions';

// redux saga
import { eventChannel } from 'redux-saga'
import {call, all, fork, put, take, takeLatest, select, takeEvery} from 'redux-saga/effects';

import watchFolders from './sagas/folders';

// other libs
import axios from 'axios';
import conf from './conf.json';
import { notification } from 'antd';
import io from 'socket.io-client';
import watchProjects from 'sagas/projects';
import watchGlobalProcessTasks from 'sagas/globalProcessTasks';

function getFuncName() {
  return getFuncName.caller.name
}

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
    console.warn(`failed in ${getFuncName()}`);
  }
}

export function* watchUsers() {
  yield takeLatest('CAILAB_INSTANCE_LOGIN', cailabInstanceLogin);
  yield takeLatest('GET_CURRENT_USER', getCurrentUser);
  yield takeLatest('LOGOUT', logout);
}

export function* loadSourceFile(action:IAction) {
  try {
    yield put({type:'SET_GENOME_BROWSER_LOADING', data:true});
    const projectId = action.data;
    const result = yield call(axios.get, `${conf.backendURL}/api/sourceFile/${projectId}`, {withCredentials: true});
    yield put({type:'SET_GENOME_BROWSER_LOADING', data:false});
    yield put({type: 'SET_SOURCE_FILE', data:result.data});
    yield put({type: 'LOAD_PROJECT_OPERATION_LOG', data: {projectId}});
    yield put({type: 'HIDE_ALL_DIALOG', data:result.data});
    yield put({type: 'CLEAR_GB_SELECTION'});
  } catch (error) {
    console.warn('failed in loadSourceFile');
  }
}

export function* loadSourceFileByProjectId(action:IAction) {
  try {
    yield put({type:'SET_GENOME_BROWSER_LOADING', data:true});
    const result = yield call(axios.get, `${conf.backendURL}/api/sourceFile/byProjectId/${action.data}`, {withCredentials: true});
    yield put({type:'SET_GENOME_BROWSER_LOADING', data:false});
    yield put({type: 'SET_SOURCE_FILE', data:result.data});
    yield put({type: 'HIDE_ALL_DIALOG', data:result.data});
    yield put({type:'GOTO_AND_FETCH_PROJECT_FILES'});
  } catch (error) {
    console.warn(`failed in ${getFuncName()}`);
  }
}

export function* forkProject(action: IAction) {
  try {
    const {id, name} = action.data;
    const result = yield call(axios.post, `${conf.backendURL}/api/project/forkedFrom/${id}?name=${name}`, {}, {withCredentials: true});
    const {_id} = result.data;
    yield put({type: 'LOAD_SOURCE_FILE', data:_id});
    yield put({type: 'GOTO_AND_FETCH_PROJECT_FILES'});
  } catch (error) {
    console.warn(`failed in ${getFuncName()}`);
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

export function* removeCreatedFeatures (aciton:IAction) {
  // 1. call api to start webexe process at back-end
  try {
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const result = yield call(
      axios.put, 
      `${conf.backendURL}/api/globalTasks/removeGeneratedFeatures/${id}`, 
      {}, 
      {withCredentials: true});

    const {newProjectId} = result.data;

    yield put({type:'LOAD_SOURCE_FILE', data: newProjectId});
    yield put({type: 'GOTO_AND_FETCH_PROJECT_FILES'});

  } catch (error) {
    yield call(notification.error, {message:error.toString()});
  }
}

function* handleServerResult(action:IAction) {
  // got server results send to backend
  const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
  const resultFileUrls = action.data.files;
  let _id;
  let selectedRange; 

  if (action.payload) {
    _id = action.payload._id;
    selectedRange = action.payload.selectedRange;
  }
  if (resultFileUrls[0]) {
    
    const result  = yield call(axios.put, `${conf.backendURL}/api/project/${id}/fromFileUrl`, {fileUrl:resultFileUrls[0], partialUpdate:!!selectedRange, range:selectedRange}, {withCredentials: true});
    yield put({type:'LOAD_SOURCE_FILE', data: result.data.newProjectId});
    yield put({type: 'GOTO_AND_FETCH_PROJECT_FILES'});
  }
  
}

export function* createPromoterTerminator(aciton:IAction) {
  // 1. call api to start webexe process at back-end
  try {
    console.log('createPromoterTerminator')
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const {promoterLength, terminatorLength, selectedRange} = aciton.data;
    const result = yield call(
      axios.put, 
      `${conf.backendURL}/api/mapping_project/gen_pro_ter/from/${id}`, 
      {
        promoterLength, 
        terminatorLength,
        selectedRange,
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
      
      if (serverAction.type === 'result') {
        const reduxAction = generateSocketAction(serverAction, {_id:id, selectedRange});
        yield put(reduxAction);
        break;
      } else {
        const reduxAction = generateSocketAction(serverAction);
        yield put(reduxAction);
      }
    }
    
  } catch (error) {
    yield call(notification.error, {message:error});
  }
}

export function* deleteProject(action:IAction) {
  try {
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const result = yield call(
      axios.delete, 
      `${conf.backendURL}/api/project/${id}`, 
      {withCredentials: true});
    
    yield put({type:'CLEAR_SOURCE_FILE'});
    yield put({type: 'GOTO_AND_FETCH_PROJECT_FILES'});

  } catch (error) {
    yield call(notification.error, {message:error});
  }
}

export function* watchGenomeOperations() {
  yield takeLatest('LOAD_SOURCE_FILE', loadSourceFile);
  yield takeLatest(LOAD_SOURCE_FILE_BY_PROJECT_ID, loadSourceFileByProjectId);
  yield takeLatest('FORK_PROJECT', forkProject);
  yield takeLatest('CREATE_PROMOTER_TERMINATOR', createPromoterTerminator);
  yield takeEvery('SERVER_RESULT', handleServerResult);
  yield takeLatest('REMOVE_CREATED_FEATURES', removeCreatedFeatures);
  yield takeLatest('DELETE_PROJECT', deleteProject);
}


export function* fetchAvailableHistory(action:IAction) {
  try {
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const result = yield call(
      axios.get, 
      `${conf.backendURL}/api/sourceFile/${id}/history`, 
      {withCredentials: true});
    yield put({type: 'SET_AVAILABLE_HISTORY', data:result.data.history});
  } catch (error) {
    yield call(notification.error, {message:error});
  }
}

export function* fetchHistorySourceFile(action:IAction) {
  // same as load source file, but load in history
  try {
    yield put({type:'SET_HISTORY_GENOME_BROWSER_LOADING', data:true});
    const result = yield call(axios.get, `${conf.backendURL}/api/sourceFile/${action.data}`, {withCredentials: true});
    yield put({type:'SET_HISTORY_GENOME_BROWSER_LOADING', data:false});
    // calculate difference between source file and history file
    const {sourceFile}:{sourceFile:ISourceFile} = yield select((state:IStoreState)=>({sourceFile:state.sourceFile}));
    const historyFile:ISourceFile = result.data;
    if (sourceFile && historyFile) {
      const sourcePartsSet = new Set<string>(sourceFile.parts.map(v=>v.sequenceHash));
      const historyPartSet = new Set<string>(historyFile.parts.map(v=>v.sequenceHash));
      const diffSetHistory = new Set<string>();
      const diffSetSource = new Set<string>();
      yield put({type: 'SET_HISTORY_DIFF', data: {diffSetHistory, diffSetSource}});
      for(const p of historyPartSet as any) {
        if(!sourcePartsSet.has(p)) {
          diffSetHistory.add(p);
        }
      }
      for(const p of sourcePartsSet as any) {
        if(!historyPartSet.has(p)) {
          diffSetSource.add(p);
        }
      }
      // console.log('SET+DIFF', diffSetHistory, diffSetSource);
      yield put({type: 'SET_HISTORY_DIFF', data: {diffSetHistory, diffSetSource}});
    }
    yield put({type: 'SET_HISTORY_SOURCE_FILE', data:result.data});
  } catch (error) {
    console.warn('failed in loadSourceFile');
  }
}

export function* watchHistories() {
  yield takeLatest('FETCH_AVAILABLE_HISTORY', fetchAvailableHistory);
  yield takeLatest('FETCH_HISTORY_SOURCE_FILE', fetchHistorySourceFile);
}


export function* downloadFile(action:IAction) {
  const {name, url} = action.data;
  const a = document.createElement('a');
  a.href = url
  a.target =  '_blank';
  a.download = `${name}`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function* watchApp() {
  yield takeLatest('DOWNLOAD_FILE', downloadFile);
}

export default function* rootSaga() {
  yield all([
    fork(watchUsers),
    fork(watchProjects),
    fork(watchFolders),
    fork(watchGenomeOperations),
    fork(watchHistories),
    fork(watchGlobalProcessTasks),
    // fork(watchWebExe),
    fork(watchApp),
  ]);
}
