import * as React from 'react'
import { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';
import useDimensions from 'react-use-dimensions';
import {Spin} from 'antd';
import styles from './GenomeBrowser.module.scss';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}


const GenomeBrowser = () => {
  const {
    sourceFile, 
    zoomLevel, 
    viewWindowStart,
    viewWindowEnd, 
    loading,
    windowWidth,
    rulerStep,
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
  }));

  const dispatch = useDispatch();
  const [ref, { x, y, width }] = useDimensions();
  useEffect(() => {
    if (width>0) {
      dispatch({type:'SET_GENOME_BROWSER_WINDOW_WIDTH', data: width});
    }
  });

  const setZoomLevel = (level:number) => {
    dispatch({type:'SET_ZOOM_LEVEL',data:level})
  }

  const setToolTipPos = (x:number, y:number, text:any) => {
    dispatch({type:'SET_TOOL_TIPS', data:{x,y,text}});
  }

  const zoom = (v:number) => v / zoomLevel;
  if(!sourceFile) {
    return <div ref={ref}/>
  }

  // filter parts
  const features = sourceFile!.parts
    .filter((v)=>
      v.start <= viewWindowEnd &&
      v.end >= viewWindowStart 
    )
    .map(v=>({...v, row:0}));
  let featuresLen = features.length;

  if (features.length>200) {
    // too much elements, show warning
    setZoomLevel(Math.max(1, zoomLevel/2))
    return <div ref={ref}
      style={{
        height:400, 
        backgroundColor:'#ffaaaa',
        textAlign:'center',
        }}
      onClick={()=>setZoomLevel(Math.max(1, zoomLevel/2))}
      >
      too many elements ({features.length}) in the window, click here to zoom out
    </div>
  }

  if (viewWindowStart > sourceFile.len) {
    dispatch({type:'GENOME_BROWSER_SCROLL_LEFT', data: 1})
  }
  
  const rowLength:any = {}
  let maxRow = 0;
  for (let i=0;i<featuresLen;i++) {
    let row = 0;
    while(row<100) {
      if (rowLength[row] === undefined) {
        rowLength[row] = 0;
      }
      if(zoom(features[i].start) >= rowLength[row]) {
        features[i].row = row;
        rowLength[row] = zoom(features[i].end);
        break;
      } else {
        row++
        if (row>maxRow) {
          maxRow = row;
        }
      }
    }
  }



  // const svgWidth = zoom(sourceFile.len);
  const svgWidth = windowWidth;
  const svgHeight = 400;
  const svgFeatureZoneHeight = svgHeight - 20;
  const rulerLines = [];
  // dispatch({type:'SET_RULER_STEP', data:rulerStep})

  let rowHeight = 30;
  if (maxRow>10) {
    rowHeight = svgFeatureZoneHeight/(maxRow+1);
  }
  const featureHeight = rowHeight-3;

  for (let i=viewWindowStart;i<sourceFile.len && i<viewWindowEnd;i+=rulerStep) {
    const zi = zoom(i);
    rulerLines.push(<line key={i} x1={zi} y1="0" x2={zi} y2={svgHeight} stroke="#aaa"/>)
    rulerLines.push(<text key={`${i}_t`} x={zi} y={0} alignmentBaseline="hanging">{i/1000}k</text>)
  }

  const zi = zoom(sourceFile.len);
  rulerLines.push(<line key={sourceFile.len} x1={zi} y1="0" x2={zi} y2={svgHeight} stroke="#aaa"/>)
  rulerLines.push(<text key={`${sourceFile.len}_t`} x={zi} y={20} alignmentBaseline="hanging">{sourceFile.len/1000}k</text>)


  let scollDeltaY = 0;

  const sourceFileLen = sourceFile.len;
  const maxAllowedScollPos = sourceFileLen+100*zoomLevel;
  
  return <Spin spinning={loading}>
    <div style={{height:40}}>
      <button onClick={()=>setZoomLevel(zoomLevel*2)}>-</button>
      <button onClick={()=>setZoomLevel(Math.max(1, zoomLevel/2))}>+</button>
      <span>zoom level: 1:{zoomLevel}</span>
      <span> {viewWindowStart} {viewWindowEnd} / {Math.floor(windowWidth)} / {featuresLen}}</span>
      <button onClick={()=>dispatch({type:'GENOME_BROWSER_SCROLL_LEFT', data: {step:3}})}> left </button>
      <button onClick={()=>dispatch({type:'GENOME_BROWSER_SCROLL_RIGHT', data: {step:3, max:maxAllowedScollPos}})}> right </button>
    </div>
  <div
    className="chromosome-svg-container"
    style={{
      maxHeight: svgHeight,
      overflowY: 'hidden',
      overflowX: 'hidden',
    }}
    ref={ref}
  >
    <svg height={svgHeight} width={svgWidth}
      onWheel={(event)=>{
        const {deltaY} = event;
        scollDeltaY += deltaY;
        if (scollDeltaY <= -100) {
          dispatch({type:'GENOME_BROWSER_SCROLL_LEFT', data: {step:1}})
          scollDeltaY = 0
        } else if (scollDeltaY >= 100) {
          dispatch({type:'GENOME_BROWSER_SCROLL_RIGHT', data: {step:1, max:maxAllowedScollPos}})
          scollDeltaY = 0
        }
        return false;
      }}
    >
      <g transform={`translate(${-zoom(viewWindowStart)},0)`}>
      <g>
        {rulerLines}
      </g>
      <g transform="translate(0, 20)">
        {
          features.map(
            (v,i)=>{
              let x = zoom(v.start);
              let width = zoom(v.end-v.start);
              let shape = v.strand;
              if(x< zoom(viewWindowStart) - 1 && zoom(v.end) > zoom(viewWindowEnd) + 1) {
                x = zoom(viewWindowStart) - 1;
                width = windowWidth + 2;
                shape = 0;
              }
              return <g key={i}>
              <ArrowFeature
                x={x}
                y={v.row*(rowHeight) + (v.featureType === 'unknown' ? rowHeight/3 : 0)}
                width={width}
                height={v.featureType === 'unknown' ? (featureHeight)/3 : (featureHeight)}
                blockId={v._id}
                annotationPart={v}
                shape={shape}
                style={{
                  fill: calcFeatureColor(v.featureType),
                  stroke: 'black',
                  strokeWidth: 1,
                }}
                data-memo={`${v.start} ${v.end} ${v.end-v.start}`}
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
            </g>}
          )
        }
      </g>
      </g>
    </svg>
    </div>
    <div className={styles.MyScrollBar}
      onMouseDown={(event)=>{
        let pos = event.clientX/windowWidth*sourceFileLen;
        const viewWindowWidth = viewWindowEnd - viewWindowStart
        let start = pos - Math.floor(viewWindowWidth/2);
        if (start < 0) start = 0;
        let end = start + viewWindowWidth;
        if (end>maxAllowedScollPos) {
          end = maxAllowedScollPos;
          start = end - viewWindowWidth;
        }
        dispatch({type:'GENOME_BROWSER_SET_CURSOR_POS', data:Math.floor((start+end)/2)});
      }}
    >
        <div className={styles.ScrollBlock}
          style={{
            left:viewWindowStart/maxAllowedScollPos*windowWidth,
            width:(viewWindowEnd - viewWindowStart)/maxAllowedScollPos*windowWidth}
          }
        />
    </div>
    </Spin>;
};

export default GenomeBrowser