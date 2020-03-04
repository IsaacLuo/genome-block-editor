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
    showDialog: state.componentVisible.removeCreatedFeaturesDialogVisible,
    message: state.generalTask.message,
    progress: state.generalTask.progress,
    outputLog: state.generalTask.outputLog,
  }));
  const [confirming, setConfirming] = useState<boolean>(false);
  const dispatch = useDispatch();

  useEffect(()=>{
    if (!showDialog) {
      setConfirming(false);
    }
  }, [showDialog])

  return <Modal
    title="remove non-gene annotations"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({type:'REMOVE_CREATED_FEATURES'})
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_REMOVE_CREATED_FEATURES_DIALOG'})}
    }
  >
    <p>remove non-gene annotations, will not change the sequence</p>
    <Progress percent={progress} />
    <div>{message}</div>
    {/* <Button type="primary" onClick={()=>dispatch({type:'REMOVE_CREATED_FEATURES'})}>start</Button> */}
  </Modal>
}

export default CreatePromoterTermiatorDlg;