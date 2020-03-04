import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button} from 'antd';
import styled from 'styled-components'

const LogList = styled.div`
  height: 150px;
  overflow-y: scroll;
  margin-left:auto;
  margin-right:auto;
  background-color:#ddd;
`

const CreatePromoterTermiatorDlg = () => {
  const {
    showDialog,
    message,
    progress,
    outputLog,
  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.generatePromoterTerminatorDialogVisible,
    message: state.generalTask.message,
    progress: state.generalTask.progress,
    outputLog: state.generalTask.outputLog,
  }));
  const [promoterLength, setPromoterLen] = useState<number>(500);
  const [terminatorLength, setTerminatorLen] = useState<number>(200);
  const [percentage, setPercentage] = useState<number>(0);
  const [confirming, setConfirming] = useState<boolean>(false);

  useEffect(()=>{
    if (!showDialog) {
      setConfirming(false);
    }
  }, [showDialog])

  const dispatch = useDispatch();
  return <Modal
    title="Title"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({type:'CREATE_PROMOTER_TERMINATOR', data:{promoterLength, terminatorLength}})
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_CREATE_PROMOTER_TERMINATOR_DIALOG'})}
    }
  >
    promoter length <InputNumber min={0} defaultValue={promoterLength} onChange={(value)=>setPromoterLen(value?value:promoterLength)} />
    terminator length <InputNumber min={0} defaultValue={terminatorLength} onChange={(value)=>setTerminatorLen(value?value:terminatorLength)} />
    <p>create promoter and terminator annotations besides each gene</p>
    <Progress percent={progress} />
    <div>{message}</div>
  {/* <LogList>{outputLog}</LogList> */}
    {/* <Button type="primary" onClick={()=>dispatch({type:'CREATE_PROMOTER_TERMINATOR', data:{promoterLength, terminatorLength}})}>start</Button> */}
  </Modal>
}

export default CreatePromoterTermiatorDlg;