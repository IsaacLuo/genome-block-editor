import React from 'react';
import { Button } from 'antd';
import { useMappedState, useDispatch } from 'redux-react-hook';



const GenomeOperationPanel: React.FC = () => {

  const state = useMappedState((state:IStoreState)=>({
    sourceFile: state.sourceFile,
    loading: state.genomeBrowser.loading,
  }));

  const dispatch = useDispatch();

  const operations = [
    {
      name: 'fork project',
      visible: (state:any) => state.sourceFile !== undefined ,
      onClick: ()=>{
        if (state.sourceFile) {
          dispatch({type:'FORK_PROJECT', data:state.sourceFile._id});
        } else {
          console.error('FORK_PROJECT');
        }
      }
    },
    {
      name: 'create promoter terminator',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'singleLayerProject'),
      onClick: ()=>{
        dispatch({type:'CREATE_PROMOTER_TERMINATOR'})
      }
    },
  ]

  const onClickCreatePromoterTerminator = () => {

  }

  const onClickForkProject = () => {
    
  }

  return (
      <div>
        {operations
          .filter(v=>v.visible(state))
          .map((operation, i)=>
            <Button key={i} onClick={operation.onClick}>{operation.name}</Button>
          )}
      </div>
  );
}

export default GenomeOperationPanel;
