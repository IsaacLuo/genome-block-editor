import * as React from 'react'
import { useDispatch } from "redux-react-hook";

export interface IProps {
  x:number;
  y:number;
  width: number;
  height: number;
  blockId: string;
  style: any;
  name: string;
  shape: string;
  onMouseMove?: (event: React.MouseEvent<any, MouseEvent>) => void;
  onMouseLeave?: (event: React.MouseEvent<any, MouseEvent>) => void;
}

const Component = ({x,y,blockId, name, width, height, style, shape, onMouseMove, onMouseLeave}:IProps) => {
  const dispatch = useDispatch();
  let block;
  const maxHeadLen = height / 3;
  const headLen = width < maxHeadLen ? width/2 : maxHeadLen;
  const bodyWidth = width - headLen;
  let textOffset = 0;
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
        style={style}
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
      onDoubleClick={()=>dispatch({type:'ADD_NEW_BLOCK', data: {id:blockId, name}})}
    >
      {block}
      {width > name.length*8 && 
        name !== 'unknown' && 
        <text 
          x={x+textOffset} 
          y={y+height/2} 
          alignment-baseline="middle"
          fontFamily="Inconsolata"
          fontSize="12"
        >
          {name}
        </text>
      }
    </g>
  );
};

export default Component