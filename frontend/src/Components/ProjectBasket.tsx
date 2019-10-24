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
  const {project} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
  }));
  return <div style={{display:'flex'}}>
      {project.map((v,i)=>
      <Block
        key = {i}
        blockId = {v}
        pos = {i}
      >{v}</Block>)
      }
    </div>;
};

export default Component