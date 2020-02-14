
// redux saga
import {call, all, fork, put, takeLatest, select} from 'redux-saga/effects';

import watchWebExe from './sagas/webexe';

// other libs
import axios from 'axios';
import conf from './conf.json';
import { notification } from 'antd';

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

export function* forkProject(action: IAction) {
  try {
    yield call(axios.post, `${conf.backendURL}/api/project/forkedFrom/${action.data}`, {withCredentials: true});

    // yield put({type: 'SET_SOURCE_FILE', data:});
  } catch (error) {
    console.warn('unable to logout');
  }
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
    console.log('ws url = ', taskInfo.serverURL);
    // 2. start webexe task at ws
    yield put({type: 'ATTACH_TASK', data:{taskUrl:taskInfo.serverURL}});
  } catch (error) {
    yield call(notification.error, {message:error});
  }
}

export function* watchGenomeOperations() {
  yield takeLatest('FORK_PROJECT', forkProject);
  yield takeLatest('CREATE_PROMOTER_TERMINATOR', createPromoterTerminator);
}

export default function* rootSaga() {
  yield all([
    fork(watchUsers),
    fork(watchGenomeOperations),
    fork(watchWebExe),
  ]);
}
