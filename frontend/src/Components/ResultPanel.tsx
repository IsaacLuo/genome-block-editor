import * as React from 'react'
import {useDispatch, useMappedState} from 'redux-react-hook';

const Component = () => {
  const {project} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
  }));
  const dispatch = useDispatch();

  return <div>
    
  </div>;
};

export default Component