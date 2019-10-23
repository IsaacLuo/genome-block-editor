import * as React from 'react'

export interface IProps {
  children: any;
  blockId: string;
}

const Component = ({children, blockId}:IProps) => {
  const [count, setCount] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
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
    onDragStart={(event)=>{setOpacity(0.1); event.dataTransfer.setData('Any', blockId)}}
    onDragOver={(event)=>{event.preventDefault();}}
    onDragEnd={()=>{setOpacity(1)}}
    onDrop={(e)=>{e.preventDefault();console.log('drop', e.dataTransfer.getData('Any'))}}
    onClick={() => setCount(count + 1)}>
      {count}
      <br/>
      {children}
    </div>
  );
};

Component.defaultProps = {
  blockId: 'unknown'
}

export default Component