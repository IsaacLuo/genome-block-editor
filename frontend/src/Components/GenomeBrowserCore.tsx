import * as React from 'react'
import { useState, useEffect, useRef } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import calcFeatureColor from '../featureColors';
import ArrowFeature from'./ArrowFeature';
import useDimensions from 'react-use-dimensions';
import {Spin} from 'antd';
import styled from 'styled-components';
import { ZoomInOutlined, ZoomOutOutlined, ForwardOutlined, BackwardOutlined } from '@ant-design/icons';

const SourceFileTitle = styled.span`
margin-right:20px;
font-weight:bold;
`

const MyScrollBar = styled.div`
    height:10px;
    width: 100%;
    background-color: #999;
`

const ScrollBlock = styled.div`
    height:10px;
    position: relative;
    background-color: #ccffcc;
    border: solid 1px black;
    min-width:20px;
    max-width:100%;
`

const UnselectaleText = styled.text`
    user-select: none;
`

interface IProps {
  sourceFile: ISourceFile|undefined,
  zoomLevel: number,
  viewWindowStart: number,
  viewWindowEnd: number,
  loading: boolean,
  windowWidth: number,
  rulerStep: number,
  highLightedParts?: Set<string>,
  
  selectionStart?: number,
  selectionEnd?: number,
  subFeatureVisible: boolean,

}

const GenomeBrowserCore = (
  {
    sourceFile,
    zoomLevel,
    viewWindowStart,
    viewWindowEnd,
    loading,
    windowWidth,
    rulerStep,
    highLightedParts,
    selectionStart,
    selectionEnd,
    subFeatureVisible,
  }:IProps
) => {
  const dispatch = useDispatch();
  const [ref, { x, y, width }] = useDimensions();
  const [scrollBarRef, {x:scrollBarX}] = useDimensions();
  
  useEffect(() => {
    if (width>0) {
      dispatch({type:'SET_GENOME_BROWSER_WINDOW_WIDTH', data: width});
    }
  },[width]);

  let svgRef = useRef<any>(null);

  const onSVGWheel = (e:any)=>{
    e.preventDefault();
  }

  useEffect(() => {
    if(svgRef.current){
      // console.log('test1');
      svgRef.current.addEventListener('wheel', onSVGWheel, { passive: false });
    }
    return ()=>{
      if(svgRef.current) {
        // console.log('test2');
        svgRef.current.removeEventListener('wheel', onSVGWheel);
      }
    }
  }, [svgRef.current]);



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
      v.end >= viewWindowStart &&
      (subFeatureVisible || v.parent === null || v.parent === undefined)
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
    rulerLines.push(<UnselectaleText key={`${i}_t`} x={zi} y={0} alignmentBaseline="hanging">{i/1000}k</UnselectaleText>)
  }

  const zi = zoom(sourceFile.len);
  rulerLines.push(<line key={sourceFile.len} x1={zi} y1="0" x2={zi} y2={svgHeight} stroke="#aaa"/>)
  rulerLines.push(<UnselectaleText key={`${sourceFile.len}_t`} x={zi} y={20} alignmentBaseline="hanging">{sourceFile.len/1000}k</UnselectaleText>)


  let scollDeltaY = 0;

  const sourceFileLen = sourceFile.len;
  const maxAllowedScollPos = sourceFileLen+100*zoomLevel;

  const selectionRect = selectionStart!== undefined && selectionEnd !== undefined && <rect
    x={zoom(selectionStart)}
    y={0}
    width={zoom(selectionEnd-selectionStart)}
    height={svgHeight}
    fill='#2343ff40'
  />
  
  return <Spin spinning={loading}>
    <div style={{height:40}}>
      {sourceFile && <SourceFileTitle>{sourceFile.name} ({sourceFile.len}bp)</SourceFileTitle>}
      <button onClick={()=>setZoomLevel(zoomLevel*2)}><ZoomOutOutlined /></button>
      <button onClick={()=>setZoomLevel(Math.max(1, zoomLevel/2))}><ZoomInOutlined /></button>
      <span>zoom level: 1:{zoomLevel}</span>
      {/* <span> {viewWindowStart} {viewWindowEnd} / {Math.floor(windowWidth)} / {featuresLen}}</span> */}
      <button onClick={()=>dispatch({type:'GENOME_BROWSER_SCROLL_LEFT', data: {step:3}})}> <BackwardOutlined /> </button>
      <button onClick={()=>dispatch({type:'GENOME_BROWSER_SCROLL_RIGHT', data: {step:3, max:maxAllowedScollPos}})}> <ForwardOutlined /> </button>
      <span> changelog: {sourceFile.changelog}</span>
    </div>
  <div
    className="chromosome-svg-container"
    style={{
      maxHeight: svgHeight,
      overflowY: 'hidden',
      overflowX: 'hidden',
    }}
    ref={ref}
    // onWheel={(event)=>{
    //     event.preventDefault();
    //     event.stopPropagation();
    //     console.log(event);
    // }}
  >
    <svg height={svgHeight} width={svgWidth}
      ref={svgRef}
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
      }}
    >
      <g transform={`translate(${-zoom(viewWindowStart)},0)`}>
      <g>
        {selectionRect}
      </g>
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
              const highLighted = (highLightedParts && highLightedParts.has(v.sequenceHash));
              // const lowLighted = (highLightedParts && !highLighted);
              return <g key={i}>
              <ArrowFeature
                x={x}
                y={v.row*(rowHeight) + (v.featureType === 'unknown' ? rowHeight/3 : 0)}
                width={width}
                height={(v.parent? 0.6: 1 )* (v.featureType === 'unknown' ? (featureHeight)/3 : (featureHeight))}
                blockId={v._id}
                annotationPart={v}
                shape={shape}
                style={{
                  fill: calcFeatureColor(v.featureType),
                  stroke: 'black',
                  strokeWidth: 1,
                }}
                specialEffect={{highLighted,}}
                data-memo={`${v.start} ${v.end} ${v.end-v.start}`}
                onClick={(event)=>{
                  const {start, end, pid} = v;
                  dispatch({type: 'GB_SELECT_ANNOTATION_PART', data: {pid, start, end}});
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
            </g>}
          )
        }
      </g>
      </g>
    </svg>
    </div>
    <MyScrollBar
      ref = {scrollBarRef}
      onMouseDown={(event)=>{
        let pos = (event.clientX-scrollBarX)/windowWidth*sourceFileLen;
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
        <ScrollBlock
          style={{
            left:viewWindowStart/maxAllowedScollPos*windowWidth,
            width:(viewWindowEnd - viewWindowStart)/maxAllowedScollPos*windowWidth,
          }}
        />
    </MyScrollBar>
    </Spin>;
};

export default GenomeBrowserCore