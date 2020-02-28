
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
      {/* <Card style={{ width: 300 }}> */}
        {state.sourceFile && <p dangerouslySetInnerHTML={{__html:
        JSON.stringify(state.sourceFile, function (key) {
          switch(key) {
            case 'parts':
              return {count:this.parts.length, first:this.parts[0]}
            default:
              return this[key];
          }
        }, 2).replace(/ /g, '&nbsp;').replace(/\n/g, '<br>')
        }}></p>}
      {/* </Card>, */}
    </div>
  );
}

export default DebugPanel;