import * as React from 'react'
import { useDispatch } from "redux-react-hook";

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Component = ({children, blockId, pos}:IProps) => {
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
    }}
    draggable={true}
    onDragStart={(event)=>{setOpacity(0.1); event.dataTransfer.setData('draggingBlockId', JSON.stringify({id:blockId, posFrom:pos}))}}
    onDragOver={(event)=>{event.preventDefault();}}
    onDragEnd={()=>{setOpacity(1)}}
    onDrop={(e)=>{
      e.preventDefault();
      const {id, posFrom} = JSON.parse(e.dataTransfer.getData('draggingBlockId'));
      console.log('drop', id, '->', blockId)
      dispatch({type:'MOVE_BLOCK_TO_BLOCK', data: {id, posFrom, posTo:pos}});
    }}
    >
      {blockId}
      <br/>
      {pos}
      <br/>
      -------------
      <br/>
      {children}
    </div>
  );
};

// Component.defaultProps = {
//   blockId: 'unknown'
// }

export default Component