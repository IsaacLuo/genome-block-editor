import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import {useMutation, useQuery} from '@apollo/react-hooks';
import { Modal, Button } from 'antd';
import {backendURL} from '../conf'

const Component = () => {
  const {project, projectCorsor} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
    projectCorsor: state.projectCorsor,
  }));
  const dispatch = useDispatch();
  const [exportProjectExec, exportProject] = useMutation(gql`
    mutation ExportProject($projectId: ID) {
      exportProject(projectId: $projectId) {
        success
        _id
      }
    }
  `);
  const queryProjects = useQuery(gql`
    {
      projects{
        _id
        name
        updatedAt
      }
    }
  `);

  const onClickExportGenbank = async ()=>{
    dispatch({type:'EXPORT_GENBANK'});
    await exportProjectExec({variables:{projectId:project._id}})
  }

  if (exportProject.data && exportProject.data.exportProject.success) {
    const fileURL = exportProject.data.exportProject._id
    const a = document.createElement('a');
    a.href = `${backendURL}/${fileURL}`;
    a.target =  '_blank';
    a.download = `test.gb`;
    a.click();
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