import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Checkbox, Form} from 'antd';
import styled from 'styled-components';

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
    selectionStart,
    selectionEnd,
    selectionEnabled,
  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.generatePromoterTerminatorDialogVisible,
    message: state.generalTask.message,
    progress: state.generalTask.progress,
    outputLog: state.generalTask.outputLog,
    selectionStart: state.genomeBrowser.selectionStart,
    selectionEnd: state.genomeBrowser.selectionEnd,
    selectionEnabled: state.genomeBrowser.selectionEnabled,
  }));
  const [promoterLength, setPromoterLen] = useState<number>(500);
  const [terminatorLength, setTerminatorLen] = useState<number>(200);
  const [selectedSegmentOnly, setSelectedSegmentOnly] = useState<boolean>(selectionEnabled);
  const [confirming, setConfirming] = useState<boolean>(false);

  // const selectionValid = selectionStart !== 0 && selectionEnd !== 0 && selectionEnd > selectionStart;

  useEffect(()=>{
    console.log('showDialog', showDialog);
    if (!showDialog) {
      setConfirming(false);
      setSelectedSegmentOnly(false);
    }
  }, [showDialog])

  const dispatch = useDispatch();
  return <Modal
    title="Title"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({
        type:'CREATE_PROMOTER_TERMINATOR', 
        data:{
          promoterLength, 
          terminatorLength, 
          selectedRange: (selectionEnabled && selectedSegmentOnly ? {start: selectionStart, end: selectionEnd} : undefined)}})
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_CREATE_PROMOTER_TERMINATOR_DIALOG'})}
    }
  >
    <Form
      labelCol={{span:8}}
      wrapperCol={{span:16}}
      name="basic"
    >
      <Form.Item
        label="promoter length"
        rules={[{ required: true }]}
      >
        <InputNumber min={0} defaultValue={promoterLength} onChange={(value)=>setPromoterLen(value?value:promoterLength)} />
      </Form.Item>

      <Form.Item
        label="terminator length"
        rules={[{ required: true }]}
      >
        <InputNumber min={0} defaultValue={terminatorLength} onChange={(value)=>setTerminatorLen(value?value:terminatorLength)} />
      </Form.Item>

    </Form>
    <p>create promoter and terminator annotations besides each gene</p>
    {
      selectionEnabled &&
      <Checkbox checked={selectedSegmentOnly} onChange={(e)=>{setSelectedSegmentOnly(e.target.checked)}}>for selected segment only</Checkbox>
    }
    <Progress percent={progress} />
    <div>{message}</div>
  {/* <LogList>{outputLog}</LogList> */}
    {/* <Button type="primary" onClick={()=>dispatch({type:'CREATE_PROMOTER_TERMINATOR', data:{promoterLength, terminatorLength}})}>start</Button> */}
  </Modal>
}

export default CreatePromoterTermiatorDlg;