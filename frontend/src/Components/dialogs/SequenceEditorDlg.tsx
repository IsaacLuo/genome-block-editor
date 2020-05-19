import React, { useState, useEffect, useRef } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Spin, Table, List, Input} from 'antd';
import styled from 'styled-components'
import { RightOutlined, LeftOutlined, FastBackwardOutlined, StepForwardOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import TextArea from 'antd/lib/input/TextArea';
import SequenceDiv from './SeqeunceDiv';
import SequenceAlignmentDiv from './SequenceAlignmentDiv';
import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import Axios from 'axios';
import conf from '../../conf.json';

const rcDict = {'a':'t', 't':'a', 'c':'g', 'g':'c', 'A':'T', 'T':'A', 'C':'G', 'G':'C', 'n':'n', 'N':'N'};
type rcDictType = typeof rcDict;
type rcDictKeyType = keyof rcDictType;

const rc = (seq:string)=> seq.split('').reverse().map((v:string)=>rcDict[v as rcDictKeyType]).join('')

const SequenceEditorDlg = () => {
  const {
    showDialog,
    projectId,
    projectName,
    selectionEnabled,
    selectionStart,
    selectionEnd,
    sequenceSrc,

  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.sequenceEditorDialogVisible,
    projectId: state.sourceFile && state.sourceFile._id,
    projectName: state.sourceFile && state.sourceFile.name,
    selectionEnabled: state.genomeBrowser.selectionEnabled,
    selectionStart: state.genomeBrowser.selectionStart,
    selectionEnd: state.genomeBrowser.selectionEnd,
    sequenceSrc: state.sequenceEditorDialog.sequence,
  }));
  const dispatch = useDispatch();
  const [seq, setSeq] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const [cursorEnd, setCursorEnd] = useState(0);

  // const inputForward = useRef(null);

  useEffect(()=>{
    if(showDialog && projectId && selectionEnabled) {
      dispatch({
        type:'LOAD_SEQUENCE_SEGMENT',
        data:{
          _id:projectId,
          start: selectionStart,
          end: selectionEnd,
          strand: 1,
        }
      });
    }
    setSeq(sequenceSrc);
  }, [
    showDialog, 
    projectId, 
    selectionEnabled, 
    selectionStart, 
    selectionEnd,
    sequenceSrc,
  ]);


  const onExit = () => {
    dispatch({type:'HIDE_SEQUENCE_EDITOR_DIALOG'});
  }

  const onClickExport = async () => {
    dispatch({type:'EXPORT_PROJECT_TO_GENBANK', data:{id:projectId, start:selectionStart, end:selectionEnd}});
  }

  return <Modal
    title="part details"
    width={800}
    visible={showDialog}
    onOk={()=>{
      if (seq === sequenceSrc) {
        onExit();
      } else {
        Modal.confirm({
          title: 'modify sequence?',
          icon: <ExclamationCircleOutlined />,
          content: seq.length === sequenceSrc.length ? 
          'the sequence length are the same, if you continue, the sequence will be replaced by your input and will not affect other features':
          'the sequence length has changed, if you continue, other features will be shifted too',
          onOk() {
            dispatch({type:'SEQUENCE_EDIT', data:{
              projectId: projectId,
              srcStart: selectionStart,
              srcEnd: selectionEnd,
              newSequence: seq,
            }});
          },
          onCancel() {
            onExit();
          },
        });
      }
    }}
    onCancel={()=>{
      onExit();
    }}
  >
    {!selectionEnabled || selectionEnd - selectionStart > 10000 ?
      <div> the selection limit is 10000 bp</div>
    :
    (
      <div>
        <li>{projectId}</li>
        <li>{selectionStart}</li>
        <li>{selectionEnd}</li>
        <div>{cursorPos}</div>
        <div>
        <Button type='link'
          onClick={onClickExport}
          >export to genebank</Button>
        </div>
        <div>sequence ({seq.length} bp) (cursor:{selectionStart + cursorPos} {cursorEnd !== cursorPos && `- ${selectionStart + cursorEnd}`})</div>
        <TextArea
          rows={10}
          value={seq} 
          onKeyUp={(e:any)=>{
            const cursorPos = e.target.selectionStart;
            const cursorPosEnd = e.target.selectionEnd;
            if(typeof(cursorPos) === 'number') setCursorPos(cursorPos);
            if(typeof(cursorPosEnd) === 'number') setCursorEnd(cursorPosEnd);
          }} 
          onMouseUp={(e:any)=>{
            const cursorPos = e.target.selectionStart;
            const cursorPosEnd = e.target.selectionEnd;
            if(typeof(cursorPos) === 'number') setCursorPos(cursorPos);
            if(typeof(cursorPosEnd) === 'number') setCursorEnd(cursorPosEnd);
          }}
          onChange={(e)=> setSeq(e.target.value.replace(/[^ATCGatcgNn]/g, ''))}
        />
        
      </div>
    )
    }
    
  </Modal>
}

export default SequenceEditorDlg;