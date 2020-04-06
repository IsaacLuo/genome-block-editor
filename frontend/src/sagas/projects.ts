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
          len
          featureType
          start
          end
          strand
          name
          original
          history
          createdAt
          updatedAt
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
  if (partDetailDialog.historyPart && partDetailDialog.historyPart.history && partDetailDialog.historyPart.history.length > 0) {
    historyPartId = partDetailDialog.historyPart.history[0];
  } else if (partDetailDialog.part && partDetailDialog.part.history && partDetailDialog.part.history.length > 0) {
    historyPartId = partDetailDialog.part.history[0];
  }
  // query part detail
  try {
    const result = yield call(client.query, {
      query: gql`
      {
        part (_id:"${historyPartId}") {
          _id
          len
          featureType
          start
          end
          strand
          name
          original
          updatedAt
        }
      }`
    })
    const {part} = result.data;
    yield put({type:'SET_HISTORY_PART_DETAIL', data: part});
  } catch (err) {
    console.error(err);
  }
}

export default function* watchProjects() {
  yield takeLatest('EXPORT_SOURCE_FILE_TO_GFF_JSON', exportSourceFileToGffJson);
  yield takeLatest('SHOW_PART_DETAIL_DIALOG', loadPartDetail);
  yield takeLatest('LOAD_PART_DETAIL', loadPartDetail);
  yield takeEvery('FETCH_NEXT_HISORY_PART', loadNextHistoryPart);
}
