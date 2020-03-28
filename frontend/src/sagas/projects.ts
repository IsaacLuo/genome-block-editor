import { HIDE_ALL_DIALOG } from './../actions';
import {call, select, all, fork, put, take, takeLatest, takeEvery} from 'redux-saga/effects'
import conf from '../conf.json'
import { eventChannel } from 'redux-saga'
import {delay} from 'redux-saga/effects'
import axios from 'axios';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import { InMemoryCache } from 'apollo-cache-inmemory';
import {saveAs} from 'file-saver';

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

export default function* watchProjects() {
  yield takeLatest('EXPORT_SOURCE_FILE_TO_GFF_JSON', exportSourceFileToGffJson);
}
