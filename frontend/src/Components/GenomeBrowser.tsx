import * as React from 'react'
import { useState, useEffect } from 'react';
import {useMappedState} from 'redux-react-hook';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Component = () => {
  const {sourceFile} = useMappedState((state:IStoreState)=>({
    sourceFile: state.sourceFile,
  }));

  const [zoomLevel, setZoomLevel] = useState(100);
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
        rowLength[row] = zoom(features[i].end)+3;
        break;
      } else {
        row++
      }
    }
  }
  
  return <div>
    <button onClick={()=>setZoomLevel(zoomLevel*2)}>-</button>
    <button onClick={()=>setZoomLevel(Math.max(1, zoomLevel/2))}>+</button>
  <div
    style={{
      maxHeight: 500,
      overflowY: 'scroll',
      overflowX: 'scroll',
    }}
  >
    <svg height="500" width={zoom(sourceFile.len)}>
      {
        features.map(
          (v,i)=><rect
            key={i}
            x={zoom(v.start)}
            y={v.row*33}
            width={zoom(v.end-v.start)}
            height="30"
            fill="#777"
            stroke="black"
            strokeWidth="1"
          />
        )
      }
    </svg>
    <div 
      style={{
        display:'flex', 
        flexWrap:'wrap',
      }}>
        {
            sourceFile && 
            sourceFile.parts.map(
              (v,i)=><div>
                
              </div>
            )
        }
      </div>
    </div></div>;
};

export default Component