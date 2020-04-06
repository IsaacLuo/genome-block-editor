import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Spin, Table, List} from 'antd';
import styled from 'styled-components'
import { RightOutlined, LeftOutlined, FastBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import conf from '../../conf.json';
import axios from 'axios';

interface IProps {
  partId: string;
}

const SequenceDiv = (
  {
    partId
  }:IProps
) => {
  const [sequence, setSequence] = useState<string>('');
  useEffect(()=>{
    axios.get(`${conf.backendURL}/api/part/${partId}/sequence`).then((result)=>{
      setSequence(result.data.sequence);
    })
  }, [partId]);
  if (sequence === '') {
    return <Spin/>
  }
  return <div>{sequence}</div>
}

export default SequenceDiv;