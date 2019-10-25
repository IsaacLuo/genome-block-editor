import * as React from 'react'
import {reducer, defaultStoreState} from 'reducer'
import Block from './Block'
import {useDispatch, useMappedState} from 'redux-react-hook';
import {StoreContext} from 'redux-react-hook';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Component = () => {
  const {blocks} = useMappedState((state:IStoreState)=>({
    blocks: state.chromosomeBlocks,
  }));
  return <div
    style={{
      maxHeight: 500,
      overflowY: 'scroll',
    }}
  >
    <div 
      style={{
        display:'flex', 
        flexWrap:'wrap',
      }}>
        {blocks.map((v,i)=>
        <Block
          key = {i}
          blockId = {v.name}
          pos = {i}
          panelType = "ChomosomePanel"
          defaultOperation={'COPY'}
          data= {v}
        >{v.feature}<br/>{v.end-v.start} bp</Block>)
        }
      </div>
    </div>;
};

export default Component