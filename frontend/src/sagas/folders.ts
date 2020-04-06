import { HIDE_ALL_DIALOG } from './../actions';
import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import conf from '../conf.json'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import axios from 'axios';
import apolloClient from '../apolloClient'
import { gql } from "apollo-boost";
import { InMemoryCache } from 'apollo-cache-inmemory';

const client = apolloClient();

function* fetchFolderContent(action:IAction) {
  try {
    console.log(action);
    const id = action.data;
    const result = yield call(client.query, {
      fetchPolicy:'network-only',
      query: gql`
      {
        folder${id!=='000000000000000000000000'?`(_id:"${id}")`:''}{
            _id
            name
            subFolders {
              _id
              name
            }
            projects {
              _id
              name
              updatedAt
            }
          }
        }
      `
    })
    const {folder} = result.data;
    yield put({type:'SET_FOLDER_CONTENT', data:folder})
  } catch (err) {
    console.error(err);
  }
}

// new File list level set, fetch(refresh) content of that folder
function* setFileListLevel(action:IAction) {
  try {
    yield put({type:'FETCH_FOLDER_CONTENT', data:action.data._id});
  } catch (err) {
    console.error(err);
  }
}

function* gotoAndFetchProjectFiles(action:IAction) {
  try {
    const result = yield call(client.query, {
      fetchPolicy:'network-only',
      query: gql`
      {
        projectFolder {
            _id
            name
            subFolders {
              _id
              name
            }
            projects {
              _id
              name
              updatedAt
            }
          }
        }
      `
    })
    const {projectFolder} = result.data;
    yield put({type:HIDE_ALL_DIALOG, data:projectFolder})
    yield put({type:'SET_FOLDER_CONTENT', data:projectFolder})
    yield put({type:'SET_FILE_LIST_LEVEL', data:{
      _id: projectFolder._id,
      level: 0,
    }})
  } catch (err) {
    console.error(err);
  }
}

export default function* watchFolders() {
  yield takeEvery('FETCH_FOLDER_CONTENT', fetchFolderContent);
  yield takeLatest('SET_FILE_LIST_LEVEL', setFileListLevel);
  yield takeLatest('GOTO_AND_FETCH_PROJECT_FILES', gotoAndFetchProjectFiles);
}
