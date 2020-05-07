import * as React from 'react'
import {useDispatch, useMappedState} from 'redux-react-hook';
import GenomeBrowserCore from './GenomeBrowserCore';
import { Input, InputNumber } from 'antd';

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
        selectionStart = {selectionStart}
        selectionEnd = {selectionEnd}
      />
      {sourceFile && <div>
        from:<InputNumber min={1} max={sourceFile.len} value={selectionStart+1} onChange={(val)=>val && dispatch({type:'SET_GB_SELECTION_START', data:val-1})} />
        to:<InputNumber min={1} max={sourceFile.len} value={selectionEnd+1} onChange={(val)=>val && dispatch({type:'SET_GB_SELECTION_END', data:val-1})} />
      </div>}
    </React.Fragment>
  )
};

export default GenomeBrowser