import * as React from 'react'
import { useDispatch } from "redux-react-hook";
import getPen from '../featureColors'

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
  panelType: string;
  data: any;
  defaultOperation: string;
}

const Component = ({children, blockId, pos, panelType, data, defaultOperation}:IProps) => {
  const [opacity, setOpacity] = React.useState(1);
  const dispatch = useDispatch();
  return (
    <div
    style={{
      width:100,
      height:100,
      borderWidth:1,
      borderColor:'black',
      border:'solid',
      opacity,
      fontSize: 11,
      wordBreak: 'break-all',
      margin:1,
      backgroundColor: getPen(data.featureType),
      cursor:'grab',
    }}
    draggable={true}
    onDragStart={(event)=>{
      setOpacity(0.1); 
      event.dataTransfer.setData('draggingBlockId', JSON.stringify({
        operation: defaultOperation,
        id:blockId, 
        posFrom:pos, 
        panelType,
        data,
        }))}
      }
    onDragOver={(event)=>{event.preventDefault();}}
    onDragEnd={()=>{setOpacity(1)}}
    onDrop={(e)=>{
      if (panelType === 'ProjectBasket') {
        e.preventDefault();
        const {id, posFrom, data, operation} = JSON.parse(e.dataTransfer.getData('draggingBlockId'));
        dispatch({type:`${operation}_BLOCK_TO_BLOCK`, data: {id, posFrom, posTo:pos, data}});
        e.stopPropagation();
      }
    }}
    >
      [{pos}] {blockId}
      <br/>
      ------
      <br/>
      {children}
    </div>
  );
};

// Component.defaultProps = {
//   blockId: 'unknown'
// }

export default Component