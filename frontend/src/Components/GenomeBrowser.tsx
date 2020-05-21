import * as React from 'react'
import {useDispatch, useMappedState} from 'redux-react-hook';
import GenomeBrowserCore from './GenomeBrowserCore';
import { Input, InputNumber, Button } from 'antd';
import { CloseCircleOutlined, CloseCircleFilled } from '@ant-design/icons';

const GenomeBrowser = () => {
  const {
    sourceFile, 
    zoomLevel, 
    viewWindowStart,
    viewWindowEnd, 
    loading,
    windowWidth,
    rulerStep,
    historyDiffParts,
    historyBrowserVisible,
    selectionStart,
    selectionEnd,
    selectionEnabled,
    } = useMappedState((state:IStoreState)=>({
    sourceFile: state.sourceFile,
    zoomLevel: state.genomeBrowser.zoomLevel,
    viewWindowStart: state.genomeBrowser.viewWindowStart,
    viewWindowEnd: state.genomeBrowser.viewWindowEnd,
    bufferedWindowStart:state.genomeBrowser.bufferedWindowStart,
    bufferedWindowEnd: state.genomeBrowser.bufferedWindowEnd,
    loading: state.genomeBrowser.loading,
    windowWidth: state.genomeBrowser.windowWidth,
    rulerStep: state.genomeBrowser.rulerStep,
    historyDiffParts: state.history.historyDiffParts,
    historyBrowserVisible: state.componentVisible.historyBrowserVisible,

    cursorLocation: state.genomeBrowser.cursorLocation,
    selectionStart: state.genomeBrowser.selectionStart,
    selectionEnd: state.genomeBrowser.selectionEnd,
    selectionEnabled: state.genomeBrowser.selectionEnabled,
  }));

  const dispatch = useDispatch();

  return (
    <React.Fragment>
      <GenomeBrowserCore
        sourceFile = {sourceFile}
        zoomLevel = {zoomLevel}
        loading = {loading}
        viewWindowStart = {viewWindowStart}
        viewWindowEnd = {viewWindowEnd}
        windowWidth = {windowWidth}
        rulerStep = {rulerStep}
        highLightedParts = {historyBrowserVisible ? historyDiffParts.diffSetSource: undefined}
        selectionStart = {selectionEnabled ? selectionStart: undefined}
        selectionEnd = {selectionEnabled ? selectionEnd: undefined}
      />
      {sourceFile && <div>
        from:
        <InputNumber 
          min={1} 
          max={sourceFile.len} 
          value={selectionEnabled ? selectionStart+1: undefined} 
          onChange={(val)=>typeof(val)==='number' && dispatch({type:'SET_GB_SELECTION_START', data:val-1})} 
        />
        to:
        <InputNumber 
          min={1} 
          max={sourceFile.len} 
          value={selectionEnabled ? selectionEnd: undefined} 
          onChange={(val)=>typeof(val)==='number' && dispatch({type:'SET_GB_SELECTION_END', data:val})} 
        />
        {/* <Button type="link"> */}
          <CloseCircleFilled onClick={()=>dispatch({type:'CLEAR_GB_SELECTION'})}/>
        {/* </Button> */}
      </div>}
    </React.Fragment>
  )
};

export default GenomeBrowser