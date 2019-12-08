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
  shape: string;
  onMouseMove?: (event: React.MouseEvent<any, MouseEvent>) => void;
  onMouseLeave?: (event: React.MouseEvent<any, MouseEvent>) => void;
}

const Component = ({x,y,blockId, annotationPart, width, height, style, shape, onMouseMove, onMouseLeave}:IProps) => {
  const dispatch = useDispatch();
  let block;
  const maxHeadLen = height / 3;
  const headLen = width/3 < maxHeadLen ? width/3 : maxHeadLen;
  const bodyWidth = width - headLen;
  let textOffset = 2;
  switch (shape) {
    case '+':
      block = <path 
        d={`M ${x} ${y} l ${bodyWidth} 0 l ${headLen} ${height/2} l ${-headLen} ${height/2} l ${-bodyWidth} 0 Z`}
        style={style}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}  
        />
      break;
    case '-':
      block = <path 
        d={`M ${x+width} ${y} l ${-bodyWidth} 0 l ${-headLen} ${height/2} l ${headLen} ${height/2} l ${bodyWidth} 0 Z`}
        style={{...style, stroke:'#00f'}}
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
        style={style}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
    />
    break;
  }
  return (
    <g
      onDoubleClick={()=>dispatch({type:'ADD_NEW_BLOCK', data: annotationPart})}
    >
      {block}
      {width > annotationPart.name.length*8 && 
        annotationPart.name !== 'unknown' && 
        <text 
          x={x+textOffset} 
          y={y+height/2} 
          alignmentBaseline="middle"
          fontFamily="Inconsolata"
          fontSize="12"
        >
          {annotationPart.name}
        </text>
      }
    </g>
  );
};

export default Component