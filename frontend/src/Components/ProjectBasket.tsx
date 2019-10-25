import * as React from 'react'
import Block from './Block'
import {useDispatch, useMappedState} from 'redux-react-hook';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Component = () => {
  const {project} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
  }));
  const dispatch = useDispatch();
  return <div 
      style={{
        display:'flex',
        flexWrap:'wrap',
        minHeight: 200,
      }}
      draggable={true}
      onDragOver={(event)=>{
        event.preventDefault();
        
      }}
      onDrop={(e)=>{
          e.preventDefault();
          const {id, data, panelType} = JSON.parse(e.dataTransfer.getData('draggingBlockId'));
          if (panelType !== 'ProjectBasket') {
            dispatch({type:`COPY_BLOCK_TO_BASKET`, data: {id, data}});
          }
      }}
    >
      {project.map((v,i)=>
      <Block
        key = {i}
        blockId = {v.name}
        pos = {i}
        data = {v}
        panelType = "ProjectBasket"
        defaultOperation="MOVE"
      >
        {v.feature}
        <br/>
        {v.end-v.start} bp
      </Block>)
      }
    </div>;
};

export default Component