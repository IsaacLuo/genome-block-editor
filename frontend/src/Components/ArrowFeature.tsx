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
  onMouseMove?: (event: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
  onMouseLeave?: (event: React.MouseEvent<SVGRectElement, MouseEvent>) => void;
}

const Component = ({x,y,blockId, name, width, height, style, shape, onMouseMove, onMouseLeave}:IProps) => {
  const dispatch = useDispatch();
  return (
    <g
      onDoubleClick={()=>dispatch({type:'ADD_NEW_BLOCK', data: {id:blockId, name}})}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={style}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      />
      {width > name.length*8 && 
        name !== 'unknown' && 
        <text 
          x={x} 
          y={y+height/2} 
          alignment-baseline="middle"
          fontFamily="Inconsolata"
          fontSize="16"
        >
          {name}
        </text>
      }
    </g>
  );
};

export default Component