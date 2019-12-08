import * as React from 'react'
import Block from './Block'
import {useDispatch, useMappedState} from 'redux-react-hook';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Corsor = () => <div
  style={{
    width:1, 
    height:100,
    backgroundColor: 'red',
  }}

/>

const Component = () => {
  const {project, projectCorsor} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
    projectCorsor: state.projectCorsor,
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
      {project.parts.map((v,i)=>
        <React.Fragment>
          {i===projectCorsor && <Corsor/>}
          <Block
            key = {i}
            blockId = {v.name}
            pos = {i}
            data = {v}
            panelType = "ProjectBasket"
            defaultOperation="MOVE"
          >
            {v.strand === '+' ? '--->' : v.strand === '-' ?  '<---': '----'}
            <br/>
            {v.featureType}
            <br/>
            {v.end-v.start} bp
          </Block>
        </React.Fragment>
        )
      }
    </div>;
};

export default Component