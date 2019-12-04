import * as React from 'react'
import Block from './Block'
import {useMappedState} from 'redux-react-hook';

export interface IProps {
  children: any;
  blockId: string;
  pos: number;
}

const Component = () => {
  const {sourceFile} = useMappedState((state:IStoreState)=>({
    sourceFile: state.sourceFile,
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
        {
            sourceFile && 
            sourceFile.parts.map(
                (v,i)=><div>{JSON.stringify(v)}</div>
            )
        }
      </div>
    </div>;
};

export default Component