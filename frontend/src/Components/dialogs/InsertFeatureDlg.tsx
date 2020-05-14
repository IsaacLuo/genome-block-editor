import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, Input, Progress, Button, Dropdown, Menu, InputNumber, Form, Radio, Checkbox} from 'antd';
import styled from 'styled-components'
import { UserOutlined, DownOutlined } from '@ant-design/icons';

const FormItem = styled.div`
  margin-top: 5px;
  margin-bottom: 5px;
`

const InsertFeatureDlg = () => {
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
    showDialog: state.componentVisible.insertFeatureDialogVisible,
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

  type SeqDictKey = 'loxP'|'Rox'|'Vlox';

  const [featureType, setFeatureType] = useState('gene');
  const [offset, setOffset] = useState(0);
  const [seqName, setSeqName] = useState('loxP');
  const [direct, setDirect] = useState(1);

  const seqDict = {
    loxP: 'ATAACTTCGTATAGCATACATTATACGAAGTTAT',
    Rox: 'TAACTTTAAATAATTGGCATTATTTAAAGTTA',
    Vlox: 'TCAATTTCCGAGAATGACAGTTCTCAGAAATTGA',
  }

  useEffect(()=>{
    if (!showDialog) {
      setConfirming(false);
    }
  }, [sourceFile, showDialog])

  const featureTypeMenu = (
    <Menu onClick={(v)=>{
      setFeatureType(v.key);
    }}>
      <Menu.Item key="gene">
        
        gene
      </Menu.Item>
      <Menu.Item key="terminator">
        
        terminator
      </Menu.Item>
    </Menu>
  );

  const sequenceFragmentMenu = (
    <Menu onClick={(v)=>{
      setSeqName(v.key);
    }}>
      <Menu.Item key="loxP">
        loxP
      </Menu.Item>
      <Menu.Item key="Rox">
        Rox
      </Menu.Item>
      <Menu.Item key="Vlox">
        Vlox
      </Menu.Item>
    </Menu>
  )

  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };

  return <Modal
    title="Insert Features"
    visible={showDialog}
    onOk={()=>{
      setConfirming(true);
      dispatch({type:'INSERT_PART_AFTER_FEATURE', data:{
        id: sourceFile!._id,
        featureType, 
        direct,
        offset,
        sequenceType: seqName,
        sequence: seqDict[seqName as SeqDictKey],
        selectedRange: (selectionEnabled && selectedSegmentOnly ? {start: selectionStart, end: selectionEnd} : undefined),
      }});
    }}
    confirmLoading={confirming}
    onCancel={()=>{
      setConfirming(false);
      dispatch({type:'HIDE_INSERT_FEATURE_DIALOG'})
      }}
  >
    <p>insert some sequence after some features</p>
    <Form
      labelCol={{span:8}}
      wrapperCol={{span:16}}
      name="basic"
    >
      <Form.Item
        label="Feature Type"
        rules={[{ required: true }]}
      >
        <Dropdown overlay={featureTypeMenu}>
          <Button>
            {featureType} <DownOutlined />
          </Button>
        </Dropdown>
      </Form.Item>
      <Form.Item
        label="direction"
        rules={[{ required: true }]}
      >
        <Radio.Group onChange={(e)=>setDirect(e.target.value)} value={direct}>
          <Radio value={-1}>5`</Radio>
          <Radio value={1}>3`</Radio>
        </Radio.Group>
      </Form.Item>
      <Form.Item
        label="offset"
        rules={[{ required: true }]}
      >
        <InputNumber min={0} max={1000} defaultValue={0} onChange={(v)=>v ? setOffset(v):setOffset(0)} />
        <span> bp</span>
      </Form.Item>
      <Form.Item
        label="sequence"
        rules={[{ required: true }]}
      >
        <Dropdown overlay={sequenceFragmentMenu}>
          <Button>
            {seqName} <DownOutlined />
          </Button>
        </Dropdown>
      </Form.Item>
    </Form>
    {
      selectionEnabled &&
      <Checkbox checked={selectedSegmentOnly} onChange={(e)=>{setSelectedSegmentOnly(e.target.checked)}}>for selected segment only</Checkbox>
    }
    <Progress percent={progress} />
    <div>{message}</div>
  </Modal>
}

export default InsertFeatureDlg;