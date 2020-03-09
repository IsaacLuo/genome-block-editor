import * as React from 'react'
import { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';
import useDimensions from 'react-use-dimensions';
import {Spin, Dropdown, Menu, message} from 'antd';
import styled from 'styled-components';
import GenomeBrowser from './GenomeBrowser';
import { DownOutlined } from '@ant-design/icons';

const GenomeBrowserForHistory = () => {
  const {projectId, historyBrowserVisible, availableHistory} = useMappedState((state:IStoreState)=>({
    projectId: (state.sourceFile && state.sourceFile.projectId),
    historyBrowserVisible: state.componentVisible.historyBrowserVisible,
    availableHistory: state.history.availableHistory,
  }));
  const dispatch = useDispatch();

  const onClick = ({ key }:{key:string}) => {
    message.info(`Click on item ${key}`);
  };


  useEffect(()=>{
    if(historyBrowserVisible) {
      dispatch({type:'FETCH_AVAILABLE_HISTORY'})
    }
  },[projectId, historyBrowserVisible])

  const menu = (
    <Menu onClick={onClick}>
      {
        availableHistory.map((v,i)=>
          <Menu.Item key={i}>[{new Date(v.updatedAt).toLocaleString()}] {v.name}</Menu.Item>
        )
      }
    </Menu>
  );
  return <React.Fragment>
    {historyBrowserVisible && 
      <div className="basket-panel">
        <Dropdown overlay={menu}>
    <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
      history versions <DownOutlined />
    </a>
  </Dropdown>,
        <GenomeBrowser mode={"history"}/>
      </div>
    }
  </React.Fragment>
};

export default GenomeBrowserForHistory