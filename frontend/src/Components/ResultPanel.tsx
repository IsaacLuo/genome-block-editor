import * as React from 'react'
import {useDispatch, useMappedState} from 'redux-react-hook';

const Component = () => {
  const {project} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
  }));
  const sequence = project.map(v=>v.seq).join('');
  return <div 
      style={{
        wordBreak: 'break-all',
        textAlign:'left',
        fontSize: 11,
      }}
    >
      {sequence}
    </div>;
};

export default Component