import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import {useMutation, useQuery} from '@apollo/react-hooks';
import { Modal, Button } from 'antd';

const Component = () => {
  const {project, projectCorsor} = useMappedState((state:IStoreState)=>({
    project: state.currentProject,
    projectCorsor: state.projectCorsor,
  }));
  const dispatch = useDispatch();
  const SAVE_PROJECT = gql`
    mutation SaveProject($project: ProjectInput) {
      saveProject(project: $project) {
        success
      }
    }
  `;
  const [saveProject, {data}] = useMutation(SAVE_PROJECT);
  const queryProjects = useQuery(gql`
    {
      projects{
        _id
        name
        updatedAt
      }
    }
  `);

  const onClickExportGenbank = ()=>{
    dispatch({type:'EXPORT_GENBANK'});
  }
  return <React.Fragment>
    <div><a onClick={()=>dispatch({type:'SHOW_OPEN_FILE_DIALOG'})}>open project</a></div>
    <div><a onClick={()=>dispatch({type:'SHOW_SAVE_FILE_DIALOG', data:{newFile: false}})}>save</a></div>
    <div><a onClick={()=>dispatch({type:'SHOW_SAVE_FILE_DIALOG', data:{newFile: true}})}>save as...</a></div>
    <div><a onClick={onClickExportGenbank}>export genbank</a></div>
  </React.Fragment>;
};

export default Component