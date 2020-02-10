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
  const {showDialog} = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.generatePromoterTerminatorDialogVisible,
  }));
  const [promoterLength, setPromoterLen] = useState<number>(500);
  const [terminatorLength, setTerminatorLen] = useState<number>(200);
  const [percentage, setPercentage] = useState<number>(0);

  const [confirming, setConfirming] = useState<boolean>(false);
  const dispatch = useDispatch();
  return <Modal
    title="Title"
    visible={showDialog}
    onOk={()=>{}}
    confirmLoading={confirming}
    onCancel={()=>dispatch({type:'HIDE_CREATE_PROMOTER_TERMINATOR_DIALOG'})}
  >
    promoter length <InputNumber min={0} defaultValue={promoterLength} onChange={(value)=>setPromoterLen(value?value:promoterLength)} />
    terminator length <InputNumber min={0} defaultValue={terminatorLength} onChange={(value)=>setTerminatorLen(value?value:terminatorLength)} />
    <p>test</p>
    <Progress percent={30} />
    <LogList>123</LogList>
    <Button type="primary" onClick={()=>dispatch({type:'CREATE_PROMOTER_TERMINATOR', data:{promoterLength, terminatorLength}})}>start</Button>
  </Modal>
}

export default CreatePromoterTermiatorDlg;