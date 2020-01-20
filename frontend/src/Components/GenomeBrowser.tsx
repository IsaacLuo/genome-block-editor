import * as React from 'react'
import { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';
import useDimensions from 'react-use-dimensions';
import {Spin} from 'antd';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

// function useWindowWidth() {
//   const [width, setWidth] = useState(window.innerWidth);
  
//   useEffect(() => {
//     const handleResize = () => setWidth(window.innerWidth);
//     window.addEventListener('resize', handleResize);
//     return () => {
//       window.removeEventListener('resize', handleResize);
//     };
//   });
  
//   return width;
// }

const GenomeBrowser = () => {
  const {
    sourceFile, 
    zoomLevel, 
    bufferedWindowStart, 
    bufferedWindowEnd, 
    loading,
    } = useMappedState((state:IStoreState)=>({
    sourceFile: state.sourceFile,
    zoomLevel: state.genomeBrowser.zoomLevel,
    bufferedWindowStart:state.genomeBrowser.bufferedWindowStart,
    bufferedWindowEnd: state.genomeBrowser.bufferedWindowEnd,
    loading: state.genomeBrowser.loading,
  }));

  const [ref, { x, y, width }] = useDimensions();
  useEffect(() => {
    console.log(x,y,width)
  });

  const dispatch = useDispatch();

  const setZoomLevel = (level:number) => {
    dispatch({type:'SET_ZOOM_LEVEL',data:level})
  }

  const setToolTipPos = (x:number, y:number, text:any) => {
    dispatch({type:'SET_TOOL_TIPS', data:{x,y,text}});
  }

  const zoom = (v:number) => v / zoomLevel;
  if(!sourceFile) {
    return <div/>
  }

  const features = sourceFile!.parts.slice(0, 10).map(v=>({...v, row:0}));
  const featuresLen = Math.min(features.length, 100);
  const rowLength:any = {}
  for (let i=0;i<featuresLen;i++) {
    let row = 0;
    while(row<10) {
      if (rowLength[row] === undefined) {
        rowLength[row] = 0;
      }
      if(zoom(features[i].start) >= rowLength[row]) {
        features[i].row = row;
        rowLength[row] = zoom(features[i].end);
        break;
      } else {
        row++
      }
    }
  }

  const svgWidth = zoom(sourceFile.len);
  const svgHeight = 400;
  const rulerLines = [];
  let rulerStep = 50;
  while(zoom(rulerStep) < 100) {
    rulerStep *= 2;
  }
  for (let i=0;i<sourceFile.len;i+=rulerStep) {
    const zi = zoom(i);
    rulerLines.push(<line key={i} x1={zi} y1="0" x2={zi} y2={svgHeight} stroke="#aaa"/>)
    rulerLines.push(<text key={`${i}_t`} x={zi} y={0} alignmentBaseline="hanging">{i/1000}k</text>)
  }
  
  return <Spin spinning={loading}>
    <div style={{height:40}}>
      <button onClick={()=>setZoomLevel(zoomLevel*2)}>-</button>
      <button onClick={()=>setZoomLevel(Math.max(1, zoomLevel/2))}>+</button>
      <span>zoom level: 1:{zoomLevel}</span>
      <span>  {bufferedWindowStart} {bufferedWindowEnd}</span>
    </div>
  <div
    className="chromosome-svg-container"
    style={{
      maxHeight: svgHeight,
      overflowY: 'scroll',
      overflowX: 'scroll',
    }}
    ref={ref}
  >
    <svg height={svgHeight-40} width={svgWidth}>
      <g>
        {rulerLines}
      </g>
      <g transform="translate(0, 20)">
        {
          features.map(
            (v,i)=><g key={i}>
              <ArrowFeature
                x={zoom(v.start)}
                y={v.row*33 + (v.featureType === 'unknown' ? 10 : 0)}
                width={zoom(v.end-v.start)}
                height={v.featureType === 'unknown' ? 10 : 30}
                blockId={v._id}
                annotationPart={v}
                shape={v.strand}
                style={{
                  fill: calcFeatureColor(v.featureType),
                  stroke: 'black',
                  strokeWidth: 1,
                }}
                onMouseMove={(event)=>{
                  if (event.buttons === 0) {
                    setToolTipPos(event.pageX+20, event.pageY+20, <div>
                      {v.name}
                      <br/>
                      {v.featureType}
                      <br/>
                      {v.start} - {v.end} ({v.end-v.start} bp)
                      </div>);
                  }
                }}
                onMouseLeave={()=>setToolTipPos(-1, -1, <div/>)}
              />
            </g>
          )
        }
      </g>
    </svg>
    </div>
    </Spin>;
};

export default GenomeBrowser