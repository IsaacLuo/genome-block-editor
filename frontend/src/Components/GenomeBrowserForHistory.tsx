import * as React from 'react'
import { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';
import useDimensions from 'react-use-dimensions';
import {Spin, Dropdown, Menu, message} from 'antd';
import styled from 'styled-components';
import GenomeBrowserCore from './GenomeBrowserCore';
import { DownOutlined } from '@ant-design/icons';

const HistorySelectorArea = styled.div`

padding-top: 30px;
padding-bottom: 30px;
`

const GenomeBrowserForHistory = () => {
  const {
    projectId, 
    historyBrowserVisible, 
    availableHistory,
    

    // for GenomeBrowserCore
    sourceFile,
    zoomLevel,
    loading,
    viewWindowStart,
    viewWindowEnd,
    windowWidth,
    rulerStep,
    highLightedParts,

    locationStartOffset,
    locationEndOffset,
    selectionStart,
    selectionEnd,
    selectionEnabled,
    } = useMappedState((state:IStoreState)=>({
    projectId: (state.sourceFile && state.sourceFile.projectId),
    historyBrowserVisible: state.componentVisible.historyBrowserVisible,
    availableHistory: state.history.availableHistory,
    

    // for GenomeBrowserCore
    sourceFile: state.history.historyFile,
    loading: state.history.loading,
    zoomLevel: state.genomeBrowser.zoomLevel,
    viewWindowStart: state.genomeBrowser.viewWindowStart,
    viewWindowEnd: state.genomeBrowser.viewWindowEnd,
    bufferedWindowStart:state.genomeBrowser.bufferedWindowStart,
    bufferedWindowEnd: state.genomeBrowser.bufferedWindowEnd,
    windowWidth: state.genomeBrowser.windowWidth,
    rulerStep: state.genomeBrowser.rulerStep,
    highLightedParts: state.history.historyDiffParts.diffSetHistory,

    locationStartOffset: state.history.locationStartOffset,
    locationEndOffset: state.history.locationEndOffset,
    selectionStart: state.genomeBrowser.selectionStart,
    selectionEnd: state.genomeBrowser.selectionEnd,
    selectionEnabled: state.genomeBrowser.selectionEnabled,
  }));

  const dispatch = useDispatch();

  const onClick = ({ key }:{key:string}) => {
    dispatch({type:'FETCH_HISTORY_SOURCE_FILE', data: key});
    // message.info(`Click on item ${key}`);
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
          <Menu.Item key={v._id}>[
            {v.updatedAt
            ?
            new Date(v.updatedAt).toLocaleString()
            :
            'ORIGINAL'
            }
            ] {v.changelog}</Menu.Item>
        )
      }
    </Menu>
  );

  return <React.Fragment>
    {historyBrowserVisible && 
      <React.Fragment>
        <HistorySelectorArea>
          <Dropdown overlay={menu}>
            <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
              history versions <DownOutlined />
            </a>
          </Dropdown>
        </HistorySelectorArea>
        <div className="basket-panel">
        <GenomeBrowserCore 
          sourceFile = {sourceFile}
          zoomLevel = {zoomLevel}
          loading = {loading}
          viewWindowStart = {viewWindowStart + (locationStartOffset || 0)}
          viewWindowEnd = {viewWindowEnd + (locationStartOffset || 0)}
          windowWidth = {windowWidth}
          rulerStep = {rulerStep}
          highLightedParts = {highLightedParts}
          selectionStart = {selectionEnabled ? (selectionStart + (locationStartOffset || 0)): undefined}
          selectionEnd = {selectionEnabled ? (selectionEnd + (locationEndOffset || 0)): undefined}
        />
        </div>
      </React.Fragment>
    }
  </React.Fragment>
};

export default GenomeBrowserForHistory