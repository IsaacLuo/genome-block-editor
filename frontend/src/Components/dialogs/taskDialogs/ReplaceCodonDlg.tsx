import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, Input, Progress, Button, Checkbox} from 'antd';
import styled from 'styled-components'

const LogList = styled.div`
  height: 150px;
  overflow-y: scroll;
  margin-left:auto;
  margin-right:auto;
  background-color:#ddd;
`

const ReplaceCodonDlg = () => {
  const {
    showDialog,
    message,
    progress,
    outputLog,
    sourceFile,
    selectionStart,
    selectionEnd,
    selectionEnabled,
  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.replaceCodonDialogVisible,
    message: state.generalTask.message,
    progress: state.generalTask.progress,
    outputLog: state.generalTask.outputLog,
    sourceFile: state.sourceFile,
    selectionStart: state.genomeBrowser.selectionStart,
    selectionEnd: state.genomeBrowser.selectionEnd,
    selectionEnabled: state.genomeBrowser.selectionEnabled,
  }));
  const [confirming, setConfirming] = useState<boolean>(false);
  const [selectedSegmentOnly, setSelectedSegmentOnly] = useState<boolean>(selectionEnabled);
  const dispatch = useDispatch();

  const [rules, setRules] = useState(`TAG:TAA TGA:TAA`);

  useEffect(()=>{
    if (!showDialog) {
      setConfirming(false);
    }
  }, [showDialog])

  useEffect(()=>{
    setSelectedSegmentOnly(selectionEnabled);
  }, [selectionEnabled])

  return <Modal
    title="Title"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({type:'REPLACE_CODON_TASK', data:{
        id:sourceFile!._id, 
        rules,
        selectedRange: (selectionEnabled && selectedSegmentOnly ? {start: selectionStart, end: selectionEnd} : undefined),
      }});
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_REPLACE_CODON_DIALOG'});
      }}
  >
    <p>replace codon</p>
    <p>rules like "TAG:TAA TGA:TAA"</p>

    <Input value={rules} onChange={(event)=>setRules(event.target.value)} />
    {
      selectionEnabled &&
      <Checkbox checked={selectedSegmentOnly} onChange={(e)=>{setSelectedSegmentOnly(e.target.checked)}}>for selected segment only</Checkbox>
    }
    <Progress percent={progress} />
    <div>{message}</div>
    {/* <Button type="primary" onClick={()=>dispatch({type:'REMOVE_CREATED_FEATURES'})}>start</Button> */}
  </Modal>
}

export default ReplaceCodonDlg;