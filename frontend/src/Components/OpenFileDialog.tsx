import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import {useMutation, useQuery, useLazyQuery} from '@apollo/react-hooks';
import { Modal, Button } from 'antd';

const Component = () => {
  const {openFileDialogVisible, project} = useMappedState((state:IStoreState)=>({
    openFileDialogVisible: state.componentVisible.openFileDialogVisible,
    project: state.currentProject,
  }));
  const dispatch = useDispatch();

  const queryProjects = useQuery(gql`
    {
      projects{
        _id
        name
        updatedAt
      }
    }
  `);

  useEffect(() => {
    if (openFileDialogVisible) {
      queryProjects.refetch();
    }
  }, [openFileDialogVisible]);

  const [queryProjectByIdExec, queryProjectById] = useLazyQuery(gql`
  query Project($id: ID!){
    project (_id:$id) {
      _id
      name
      parts {
        _id
        len
        featureType
        strand
        name
        original
      }
      updatedAt
    }
  }
`);

  if (queryProjectById.data && project !== queryProjectById.data.project) {
    console.log(queryProjectById.data.project);
    dispatch({type:'HIDE_OPEN_FILE_DIALOG'});
    dispatch({type:'SET_CURRENT_PROJECT', data: queryProjectById.data.project});
  }

  const handleOpenDialogOk = async ()=>{
    dispatch({type:'HIDE_OPEN_FILE_DIALOG'});
  }
  const onClickOpenFile = async (fileId:string)=> {
    queryProjectByIdExec({variables: {id:fileId}});
  }

  return openFileDialogVisible ? <div><Modal
      title="Open File"
      visible={openFileDialogVisible}
      onOk={handleOpenDialogOk}
      onCancel={handleOpenDialogOk}
    >
    <div>{queryProjects.loading ? 
      'loading': 
      <div>
        {queryProjects.data && queryProjects.data.projects.map(
          (v:any, i:number)=>
            <div key={i} onClick={()=>onClickOpenFile(v._id)}>{v.name}</div>
        )}
      </div>
    }</div>
    </Modal>
    </div> : <div/>
};

export default Component