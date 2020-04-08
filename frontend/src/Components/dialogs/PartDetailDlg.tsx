import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Spin, Table, List} from 'antd';
import styled from 'styled-components'
import { RightOutlined, LeftOutlined, FastBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import TextArea from 'antd/lib/input/TextArea';
import SequenceDiv from './SeqeunceDiv';
import SequenceAlignmentDiv from './SequenceAlignmentDiv';

const PartDetailDlgPanel = styled.div`
  display: flex;
  align-items: center;
`

const PartDetailDlgMainPart = styled.div`
  flex-grow: 1;
  display:flex;
  flex-direction:column;
`
const PartDetailDlgSideController = styled.div`
  font-size: 200%;
  color: #616161;
  margin: 5px;
  cursor: pointer;
`

const PropertyContainer = styled.div`
  display:flex;
  align-items: center;
`

const PropertyTitle = styled.div`
  width: 100px;
`
const PropertyValue = styled.div`
`

const PartDetailDlg = () => {
  const {
    showDialog,
    partId,
    part,
    historyPart,
  } = useMappedState((state:IStoreState)=>({
    showDialog: state.componentVisible.partDetailDialogVisible,
    partId: state.partDetailDialog.basePartId,
    part: state.partDetailDialog.part,
    historyPart: state.partDetailDialog.historyPart,
  }));
  const dispatch = useDispatch();
  const [seqSwitchOn, setSeqSwitch] = useState<boolean>(false);

  useEffect(()=>{
    // setCurrentPartId(partId);
    setSeqSwitch(false);
  }, [partId]);

  
  // build table
  let columns = [
    {
      title: 'key',
      dataIndex: 'key',
      key: 'key',
    },
    {
      title: 'value',
      dataIndex: 'value',
      key: 'value',
    }
  ];

  if (historyPart) {
    columns.push({
      title: 'history',
      dataIndex: 'history',
      key: 'history',
    })
  }

  const genHistoryText = (key: keyof IAnnotationPartWithDetail) => part && historyPart && historyPart[key] !== part[key] ? historyPart[key] : ' - '

  const generateTableData = ()=>{
    return [
      {
        key: 'name',
        value: part!.name,
        history: genHistoryText('name'),
      }, {
        key: 'type',
        value: part!.featureType,
        history: genHistoryText('featureType'),
      }, {
        key: 'ID',
        value: part!._id,
        history: genHistoryText('_id'),
      }, {
        key: 'length',
        value: part!.len,
        history: genHistoryText('len'),
      }, {
        key: 'start',
        value: part!.start,
        history: genHistoryText('start'),
      }, {
        key: 'end',
        value: part!.end,
        history: genHistoryText('end'),
      }, {
        key: 'strand',
        value: part!.strand,
        history: genHistoryText('strand'),
      }, {
        key: 'time',
        value: new Date(part!.updatedAt).toLocaleString(),
        history: new Date(genHistoryText('updatedAt')).toLocaleString(),
      }, {
        key: 'historyCount',
        value: part!.history.length,
        history: '',
      }
    ]
  }

  const onExit = () => {
    setSeqSwitch(false);
    dispatch({type:'HIDE_PART_DETAIL_DIALOG'});
  }

  return <Modal
    title="part details"
    width={800}
    visible={showDialog}
    onOk={()=>{
      onExit();
    }}
    onCancel={()=>{
      onExit();
    }}
  >
    {part ?
    <PartDetailDlgPanel>
      <PartDetailDlgSideController>
        {historyPart && <FastBackwardOutlined
          onClick={()=>dispatch({type:'PART_DETAIL_GOTO_LATEEST_VERSION'})}
        />}
      </PartDetailDlgSideController>
      <PartDetailDlgMainPart>
      <List
        bordered
        dataSource={generateTableData()}
        renderItem={item => (
          <List.Item>
            <PropertyContainer>
              <PropertyTitle>{item.key} : </PropertyTitle>
              <PropertyValue>
                <React.Fragment>
                <div>{item.value}</div>
                {
                  historyPart &&
                  <div style={{color:item.history=== ' - ' ? 'inhert' : 'red'}}>{item.history}</div>
                }
                </React.Fragment>
              </PropertyValue>
              
            </PropertyContainer>

          </List.Item>
        )}
      />
      {
        seqSwitchOn
        ?
        <div style={{width:700,overflowX:"scroll", whiteSpace: "nowrap"}}>
          {
            historyPart ?
            <SequenceAlignmentDiv partId1={part._id} partId2={historyPart._id}/>
            :
            <SequenceDiv partId={part._id}/>
          }
        </div>
        :
        <Button type="link" onClick={()=>setSeqSwitch(true)}>get sequence</Button>
      }

      </PartDetailDlgMainPart>
      <PartDetailDlgSideController>
        {part.history.length>0 && <StepForwardOutlined
          onClick={()=>dispatch({type:'FETCH_NEXT_HISORY_PART'})}
        />}
      </PartDetailDlgSideController>

    </PartDetailDlgPanel>
    : <Spin/>
    }
    
  </Modal>
}

export default PartDetailDlg;