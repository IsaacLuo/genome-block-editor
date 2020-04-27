
import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Card} from 'antd';
import styled from 'styled-components'
import { RouteComponentProps, Link } from 'react-router-dom';
import { Menu } from 'antd';
import conf from 'conf.json';

const DebugPanel = () => {
  const state = useMappedState((state:IStoreState)=>(state));
  
  return (
    <div style={{textAlign:"left"}}>
      <div>(debug info)</div>
      {state.sourceFile &&
      <div>
        <div> id: {state.sourceFile._id}</div>
        <div>pid: {state.sourceFile.projectId}</div>
      </div>}
      {state.history.historyFile &&
      <div>
        <div>history id: {state.history.historyFile._id}</div>
        <div>history pid: {state.history.historyFile.projectId}</div>
      </div>}
    </div>
  );
}

export default DebugPanel;