import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Spin, Table, List} from 'antd';
import styled from 'styled-components'
import { RightOutlined, LeftOutlined, FastBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import conf from '../../conf.json';
import axios from 'axios';

const RedLetters = styled.span`
  color:red;
`
const SequenceText = styled.div`
  font-family: Consolas, Monaco, monospace;
`

interface IProps {
  sequence1: string;
  sequence2: string;
}

const GeneralSequenceAlignmentDiv = (
  {
    sequence1,
    sequence2,
  }:IProps
) => {
  const [sequence, setSequence] = useState<any>(undefined);
  useEffect(()=>{
    axios.post(`${conf.backendURL}/api/query/globalAlignment`, {sequence1, sequence2}).then((result)=>{
      setSequence(result.data);
    })
  }, [sequence1, sequence2]);
  if (sequence === undefined) {
    return <Spin/>
  }
  const {align1, align2, begin, end} = sequence as {align1:string, align2:string, begin:number, end:number};
  // color align2
  let wasMatch = true;
  let lastSegI = begin;
  const align2Segments = [];
  for(let i=begin; i<=end; i++) {
    if(wasMatch && align1[i] !== align2[i]) {
      align2Segments.push(<span key={i}>{align2.substring(lastSegI, i)}</span>)
      wasMatch = false;
      lastSegI = i;
    } else if(!wasMatch && align1[i] !== '-' && align1[i] === align2[i]) {
      align2Segments.push(<RedLetters key={i}>{align2.substring(lastSegI, i)}</RedLetters>)
      wasMatch = true;
      lastSegI = i;
    }
  }
  if (lastSegI < end) {
    const i = end;
    if (wasMatch) {
      align2Segments.push(<span key={i}>{align2.substring(lastSegI, i)}</span>)
    } else {
      align2Segments.push(<RedLetters key={i}>{align2.substring(lastSegI, i)}</RedLetters>)
    }
  }
return <SequenceText>{align1}<br/>{align2Segments}</SequenceText>
}

export default GeneralSequenceAlignmentDiv;