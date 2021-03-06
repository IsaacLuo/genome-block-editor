import {call, select, put, take, takeLatest, takeEvery} from 'redux-saga/effects';
import conf from '../conf.json';
import { eventChannel } from 'redux-saga';
import axios from 'axios';
import apolloClient from '../apolloClient';
import { gql } from "apollo-boost";
import {saveAs} from 'file-saver';
import { Modal} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import * as React from 'react';
import io from 'socket.io-client';
import { profileEnd } from 'console';

const client = apolloClient();

function* exportSourceFileToGffJson(action:IAction) {
  try {
    const {id} = yield select((state:IStoreState)=>({id:state.sourceFile!._id}));
    const result = yield call(axios.get, `${conf.backendURL}/api/project/${id}/gffJson`, {withCredentials: true});
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
          parent
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
      const result = yield call(axios.post, `${conf.backendURL}/api/sourceFile/${sourceFile._id}/revert`, {}, {withCredentials: true});
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
            okType: 'danger' as any,
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

function* loadSequence(action:IAction) {
  try {
    const {_id, start, end, strand} = action.data;
    const result = yield call(axios.get, `${conf.backendURL}/api/project/${_id}/sequence?start=${start}&end=${end}&strand=${strand}`, {withCredentials: true});
    yield put({type:'SET_SEQUENCE_SEGMENT', data:result.data});
  } catch (err) {
    console.error(err);
  }
}



function* exportProjectToGenbank(action:IAction) {
  const monitorSocket = (socket:SocketIOClient.Socket) => {
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
  
  const generateSocketAction = (serverAction:IAction):IAction => {
    switch (serverAction.type) {
      case 'result':
        return {
          type: 'DOWNLOAD_FILE',
          data: {
            name: 'segment.gb',
            url: `${conf.backendURL}/api/webexe/file/${serverAction.data.files[0].url}/as/segment.gb`,
          }
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

  try {
    const {id, start, end} = action.data;
    const result = yield call(axios.get, `${conf.backendURL}/api/project/${id}/genbank?start=${start}&end=${end}`, {withCredentials: true});
    const {taskInfo} = result.data;
    // console.log(taskInfo);
    const {processId, serverURL} = taskInfo;

    // 2. use socket.io
    const socket = io(serverURL, {transports:['websocket']});
    const channel = yield call(monitorSocket, socket);
    socket.emit('startTask', processId, ()=>{})
    while (true) {
      const serverAction = yield take(channel)
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

export function* sequenceEdit(action:IAction) { 
  const {projectId, srcStart, srcEnd, newSequence} = action.data;
  const response = yield call(axios.post, `${conf.backendURL}/api/project/${projectId}/sequence/${srcStart}/${srcEnd}`,{sequence:newSequence}, {withCredentials: true});
  yield put({type:'LOAD_SOURCE_FILE', data: response.data.projectId});
  console.log(response.data);
}

export function* loadProjectOperationLog(action:IAction) {
  const {projectId} = action.data;
  const response = yield call(axios.get, `${conf.backendURL}/api/project/${projectId}/operationLog`, {withCredentials: true});
  yield put({type:'SET_PROJECT_OPERATION_LOG', data: response.data});
  console.log(response.data);
}

export default function* watchProjects() {
  yield takeLatest('EXPORT_SOURCE_FILE_TO_GFF_JSON', exportSourceFileToGffJson);
  yield takeLatest('SHOW_PART_DETAIL_DIALOG', loadPartDetail);
  yield takeLatest('LOAD_PART_DETAIL', loadPartDetail);
  yield takeEvery('FETCH_NEXT_HISORY_PART', loadNextHistoryPart);
  yield takeEvery('REVERT_TO_HISTORY_VERSION', revertToHistoryVersion);
  yield takeLatest('LOAD_SEQUENCE_SEGMENT', loadSequence);
  yield takeLatest('EXPORT_PROJECT_TO_GENBANK', exportProjectToGenbank);
  yield takeEvery('SEQUENCE_EDIT', sequenceEdit);
  yield takeLatest('LOAD_PROJECT_OPERATION_LOG', loadProjectOperationLog);
}
