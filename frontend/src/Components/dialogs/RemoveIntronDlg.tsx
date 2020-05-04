import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, Input, Progress, Button, Dropdown, Menu, InputNumber, Form, Radio, Checkbox} from 'antd';
import styled from 'styled-components'

const RemoveIntronDlg = () => {
  const {
    showDialog,
    message,
    progress,
    outputLog,
    sourceFile,
  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.removeIntronDialogVisible,
    message: state.generalTask.message,
    progress: state.generalTask.progress,
    outputLog: state.generalTask.outputLog,
    sourceFile: state.sourceFile,
  }));
  const [confirming, setConfirming] = useState<boolean>(false);
  const DEFAULT_INTRON_TYPES = ['intron', 'five_prime_UTR_intron'];
  const [intronTypes, setIntronTypes] = useState(DEFAULT_INTRON_TYPES);
  const dispatch = useDispatch();

  useEffect(()=>{
    if (!showDialog) {
      setConfirming(false);
    }
  }, [sourceFile, showDialog])

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  return <Modal
    title="Insert Features"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({type:'START_REMOVE_INTRON_TASK', data:{
        id: sourceFile!._id,
        intronTypes,
      }});
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_REMOVE_INTRON_DIALOG'})
      }}
  >
    <p>remove all intron from genes</p>
    <Form
      labelCol={{span:8}}
      wrapperCol={{span:16}}
      name="basic"
    >
      <Form.Item
        label="sequence"
        rules={[{ required: true }]}
      >
        <Checkbox.Group options={DEFAULT_INTRON_TYPES} defaultValue={DEFAULT_INTRON_TYPES} onChange={(value)=>setIntronTypes(value.map(v=>v.toString()))} />
      </Form.Item>
    </Form>
    <Progress percent={progress} />
    <div>{message}</div>
  </Modal>
}

export default RemoveIntronDlg;