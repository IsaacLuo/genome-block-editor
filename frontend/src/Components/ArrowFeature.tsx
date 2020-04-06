import * as React from 'react'
import { useDispatch } from "redux-react-hook";

export interface IProps {
  x:number;
  y:number;
  width: number;
  height: number;
  blockId: string;
  style: any;
  annotationPart: IAnnotationPart;
  shape: number;
  specialEffect: any;
  onMouseMove?: (event: React.MouseEvent<any, MouseEvent>) => void;
  onMouseLeave?: (event: React.MouseEvent<any, MouseEvent>) => void;
}

const ArrowFeature = ({x,y,blockId, annotationPart, width, height, style, shape, onMouseMove, onMouseLeave, specialEffect}:IProps) => {
  const dispatch = useDispatch();
  let block;
  const maxHeadLen = height / 3;
  const headLen = width/3 < maxHeadLen ? width/3 : maxHeadLen;
  const bodyWidth = width - headLen;
  let textOffset = 2;
  const finalStyle = {...style};
  if (shape === -1) {
    finalStyle.stroke = '#00f';
  }

  if(specialEffect) {
    if (specialEffect.highLighted) {
      finalStyle.stroke = 'red';
      finalStyle.strokeWidth = 2;
    }
    if (specialEffect.lowLighted) {
      finalStyle.fillOpacity=0.2;
    }
  } 
  switch (shape) {
    case 1:
      block = <path 
        d={`M ${x} ${y} l ${bodyWidth} 0 l ${headLen} ${height/2} l ${-headLen} ${height/2} l ${-bodyWidth} 0 Z`}
        style={finalStyle}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}  
        />
      break;
    case -1:
      block = <path 
        d={`M ${x+width} ${y} l ${-bodyWidth} 0 l ${-headLen} ${height/2} l ${headLen} ${height/2} l ${bodyWidth} 0 Z`}
        style={finalStyle}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}  
        />
      textOffset+=headLen;
      break;
    default:
      block = <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={finalStyle}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
    />
    break;
  }
  return (
    <g
      onDoubleClick={()=>dispatch({type:'ADD_NEW_BLOCK', data: annotationPart})}
      onContextMenu={(e)=>{
        dispatch({type:'SHOW_PART_DETAIL_DIALOG', data: annotationPart._id})
        e.preventDefault();
      }}
    >
      {block}
      {annotationPart.name && width > annotationPart.name.length*8 && 
        annotationPart.name !== 'unknown' && 
        <text 
          x={x+textOffset} 
          y={y+height/2} 
          alignmentBaseline="middle"
          fontFamily="Inconsolata"
          fontSize={Math.min(Math.floor(height), 12)}
        >
          {annotationPart.name}
        </text>
      }
    </g>
  );
};

export default ArrowFeature