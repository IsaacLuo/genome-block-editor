import * as React from 'react'
import {useDispatch, useMappedState} from 'redux-react-hook';
import GenomeBrowserCore from './GenomeBrowserCore';

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
  }));

  return <GenomeBrowserCore
        sourceFile = {sourceFile}
        zoomLevel = {zoomLevel}
        loading = {loading}
        viewWindowStart = {viewWindowStart}
        viewWindowEnd = {viewWindowEnd}
        windowWidth = {windowWidth}
        rulerStep = {rulerStep}
        highLightedParts = {historyBrowserVisible ? historyDiffParts.diffSetSource: undefined}
      />  
};

export default GenomeBrowser