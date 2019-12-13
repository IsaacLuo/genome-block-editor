import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { gql } from "apollo-boost";
import {useLazyQuery, useQuery} from '@apollo/react-hooks';
import {backendURL} from '../conf'

const Component = () => {
  const {project, projectCorsor} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
    projectCorsor: state.projectCorsor,
  }));
  const dispatch = useDispatch();
  const [queryProjectGanbankExec, queryProjectGanbank] = useLazyQuery(gql`
    query ProjectGenbank($id: ID!){
      projectGenbank (_id:$id)
    }
  `);
  const onClickExportGenbank = async ()=>{
    await queryProjectGanbankExec({variables:{id:project._id}})
    console.log(queryProjectGanbank);
    const fileURL = queryProjectGanbank.data.projectGenbank
    const a = document.createElement('a');
    a.href = `${backendURL}/${fileURL}`;
    a.target =  '_blank';
    a.download = `test.gb`;
    a.click();
  }

  if (queryProjectGanbank.data && queryProjectGanbank.data.projectGenbank.success) {

  }
  
  return <React.Fragment>
    <div><a onClick={()=>dispatch({type:'SHOW_OPEN_FILE_DIALOG'})}>open project</a></div>
    
    {project && project.parts.length > 0 && 
      <React.Fragment>
        <div><a onClick={()=>dispatch({type:'SHOW_SAVE_FILE_DIALOG', data:{newFile: false}})}>save</a></div>
        <div><a onClick={()=>dispatch({type:'SHOW_SAVE_FILE_DIALOG', data:{newFile: true}})}>save as...</a></div>
        <div><a onClick={onClickExportGenbank}>export genbank</a></div>
      </React.Fragment>
    }
  </React.Fragment>;
};

export default Component