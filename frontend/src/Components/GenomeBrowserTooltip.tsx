import * as React from 'react'
import { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';
import useDimensions from 'react-use-dimensions';

const GenomeBrowserTooltip = () => {
  const {toolTipPos} = useMappedState((state:IStoreState)=>({
    toolTipPos: state.genomeBrowser.toolTipPos,
  }));

  return <div style={{position:'absolute', left:toolTipPos.x, top:toolTipPos.y, backgroundColor: "yellow"}}>
      {toolTipPos.text}
    </div>
    ;
};

export default GenomeBrowserTooltip