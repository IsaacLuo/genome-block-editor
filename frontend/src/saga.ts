
// redux saga
import {call, all, fork, put, takeLatest, select} from 'redux-saga/effects';

// other libs
import axios from 'axios';
import conf from './conf';

export function* cailabInstanceLogin(action: IAction) {
  try {
    const res = yield call(axios.post, conf.backendURL + '/api/session', {}, {withCredentials: true});
    yield put({type: 'GET_CURRENT_USER', data: undefined});
  } catch (error) {
  }
}

export function* getCurrentUser(action: IAction) {
  try {
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
}

export function* forkProject(action: IAction) {
  try {
    yield call(axios.post, `${conf.authServerURL}/api/project/forkedFrom/${action.data}`, {withCredentials: true});

    // yield put({type: 'SET_SOURCE_FILE', data:});
  } catch (error) {
    console.warn('unable to logout');
  }
}

export function* watchGenomeOperations() {
  yield takeLatest('FORK_PROJECT', forkProject);
}

export default function* rootSaga() {
  yield all([
    fork(watchUsers),
    fork(watchGenomeOperations),
  ]);
}
