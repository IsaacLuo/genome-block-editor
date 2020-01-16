import * as React from 'react'
import { useState, useEffect } from 'react';
import {useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Component = () => {
  const {sourceFile} = useMappedState((state:IStoreState)=>({
    sourceFile: state.sourceFile,
  }));

  const [zoomLevel, setZoomLevel] = useState(128);
  const [toolTipPos, setToolTopPos] = useState({x:-1, y:-1, text: <div/>});

  const zoom = (v:number) => v / zoomLevel;
  if(!sourceFile) {
    return <div/>
  }

  const features = sourceFile!.parts.map(v=>({...v, row:0}));
  const featuresLen = features.length;
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
        // console.log(features[i].name, features[i].row);
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
  
  return <div>
    <div style={{height:40}}>
      <button onClick={()=>setZoomLevel(zoomLevel*2)}>-</button>
      <button onClick={()=>setZoomLevel(Math.max(1, zoomLevel/2))}>+</button>
      <span>zoom level: 1:{zoomLevel}</span>
    </div>
  <div
    style={{
      maxHeight: svgHeight,
      overflowY: 'scroll',
      overflowX: 'scroll',
    }}
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
                    setToolTopPos({x:event.pageX+20, y:event.pageY+20, text:<div>
                      {v.name}
                      <br/>
                      {v.featureType}
                      <br/>
                      {v.start} - {v.end} ({v.end-v.start} bp)
                      </div>});
                  }
                }}
                onMouseLeave={()=>setToolTopPos({x:-1, y:-1, text: <div/>})}
              />
            </g>
          )
        }
      </g>
    </svg>
    <div style={{position:'absolute', left:toolTipPos.x, top:toolTipPos.y, backgroundColor: "yellow"}}>
      {toolTipPos.text}
    </div>
    </div></div>;
};

export default Component