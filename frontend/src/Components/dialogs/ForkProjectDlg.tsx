import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, Input, Progress, Button} from 'antd';
import styled from 'styled-components'

const LogList = styled.div`
  height: 150px;
  overflow-y: scroll;
  margin-left:auto;
  margin-right:auto;
  background-color:#ddd;
`

const ForkProjectDlg = () => {
  const {
    showDialog,
    message,
    progress,
    outputLog,
    sourceFile,
  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.forkProjectDialogVisible,
    message: state.generalTask.message,
    progress: state.generalTask.progress,
    outputLog: state.generalTask.outputLog,
    sourceFile: state.sourceFile,
  }));
  const [confirming, setConfirming] = useState<boolean>(false);
  const dispatch = useDispatch();

  
  const [fileName, setFileName] = useState(`unkown project [${new Date().toLocaleString()}]`);

  useEffect(()=>{
    setFileName((sourceFile && sourceFile.name && sourceFile.name.replace(/\s*\[.*\]$/,'')) + ` [${new Date().toLocaleString()}]`)

  }, [sourceFile])

  return <Modal
    title="Title"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({type:'FORK_PROJECT', data:{id:sourceFile!._id, name:fileName}});
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_FORK_PROJECT_DIALOG'})
      }}
  >
    <p>test</p>
    <Input value={fileName} onChange={(event)=>setFileName(event.target.value)} />
    <Progress percent={progress} />
    <div>{message}</div>
    {/* <Button type="primary" onClick={()=>dispatch({type:'REMOVE_CREATED_FEATURES'})}>start</Button> */}
  </Modal>
}

export default ForkProjectDlg;