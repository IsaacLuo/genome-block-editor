import { HIDE_ALL_DIALOG } from './../actions';
import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import conf from '../conf.json'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import axios from 'axios';
import apolloClient from '../apolloClient';
import { gql } from "apollo-boost";
import { InMemoryCache } from 'apollo-cache-inmemory';
import {saveAs} from 'file-saver';
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import * as React from 'react';

const client = apolloClient();

function* exportSourceFileToGffJson(action:IAction) {
  try {
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const result = yield call(axios.get, `${conf.backendURL}/api/project/${id}/gffJson`);
    const gffJson = JSON.stringify(result.data);
    saveAs(new Blob([gffJson], {type: "text/plain;charset=utf-8"}), 'export.gff.json');
    console.log(gffJson);
  } catch (err) {
    console.error(err);
  }
}

function* loadPartDetail(action:IAction) {
  const _id = action.data;
  // query part detail
  try {
    const result = yield call(client.query, {
      query: gql`
      {
        part (_id:"${_id}") {
          _id
          pid
          len
          featureType
          start
          end
          strand
          name
          original
          history {
            _id
            updatedAt
            changelog
          }
          createdAt
          updatedAt
          changelog
          sequenceHash
        }
      }`
    })
    const {part} = result.data;
    yield put({type:'SET_PART_DETAIL', data: part});
  } catch (err) {
    console.error(err);
  }
}

function* loadNextHistoryPart(action:IAction) {
  const partDetailDialog:IPartDetailDialogState = yield select((state:IStoreState)=>state.partDetailDialog);
  let historyPartId;
  if (partDetailDialog.historyPart && 
        partDetailDialog.historyPart.history && 
        partDetailDialog.historyPart.history.length > 0
    ) {
    historyPartId = partDetailDialog.historyPart.history[0]._id;
  } else if (partDetailDialog.part && partDetailDialog.part.history && partDetailDialog.part.history.length > 0) {
    historyPartId = partDetailDialog.part.history[0]._id;
  }
  // query part detail
  try {
    const result = yield call(client.query, {
      query: gql`
      {
        part (_id:"${historyPartId}") {
          _id
          pid
          len
          featureType
          start
          end
          strand
          name
          original
          updatedAt
          changelog
          sequenceHash
          history {
            _id
          }
        }
      }`
    })
    const {part} = result.data;
    yield put({type:'SET_HISTORY_PART_DETAIL', data: part});
  } catch (err) {
    console.error(err);
  }
}

function* revertToHistoryVersion(aciton:IAction) {
  const sourceFile:ISourceFile = yield select((state:IStoreState)=>state.sourceFile);
  if(sourceFile) {
    try {
      const result = yield call(axios.post, `${conf.backendURL}/api/sourceFile/${sourceFile._id}/revert`);
      yield put({type: 'LOAD_SOURCE_FILE', data:result.data._id});
      yield put({type:'GOTO_AND_FETCH_PROJECT_FILES'});
    } catch (err) {
      if (err.response && err.response.status === 403) {
        // 403 prompt to delete'
        const icon = React.createElement(ExclamationCircleOutlined);
        const del = yield new Promise(resolve=>{
          Modal.confirm({
            title: 'delete project?',
            icon,
            content: 'project cannot be reverted, because it\'s the first version since forked, delete it?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk() {
              resolve(true);
            },
            onCancel() {},
          });
        })
        if (del) {
          yield put({type:'DELETE_PROJECT'});
        }
      }
    }
  }
}

export default function* watchProjects() {
  yield takeLatest('EXPORT_SOURCE_FILE_TO_GFF_JSON', exportSourceFileToGffJson);
  yield takeLatest('SHOW_PART_DETAIL_DIALOG', loadPartDetail);
  yield takeLatest('LOAD_PART_DETAIL', loadPartDetail);
  yield takeEvery('FETCH_NEXT_HISORY_PART', loadNextHistoryPart);
  yield takeEvery('REVERT_TO_HISTORY_VERSION', revertToHistoryVersion);
}
