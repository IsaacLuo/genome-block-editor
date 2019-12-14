import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import {useMutation, useQuery, useLazyQuery} from '@apollo/react-hooks';
import { Modal, Button } from 'antd';

const Component = () => {
  const {dialogVisible, project} = useMappedState((state:IStoreState)=>({
    dialogVisible: state.componentVisible.exportGenbankDialogVisible,
    project: state.currentProject,
  }));
  const dispatch = useDispatch();

  const queryProjectGanbank = useQuery(gql`
    query ProjectGenbank($id: ID!){
      projectGenbank (_id:$id)
    }
  `, {variables:{id:project._id}});

  const handleOpenDialogOk = async ()=>{
    dispatch({type:'HIDE_EXPORT_GENBANK_DIALOG'});
  }

  const onClickDownload = ()=>{
    const fileContent = queryProjectGanbank.data.projectGenbank;
    const blob = new Blob(
      [ fileContent ], // Blob parts.
      {
          type : "text/plain;charset=utf-8"
      }
    );
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url
    a.target =  '_blank';
    a.download = `${project.name}.gb`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return <Modal
      title="Open File"
      visible={dialogVisible}
      onOk={handleOpenDialogOk}
      onCancel={handleOpenDialogOk}
      destroyOnClose={true}
    >
    <div>{queryProjectGanbank.loading ? 
      'loading': 
      <div>
        {queryProjectGanbank.data && 
          <a onClick={onClickDownload}>download</a>
        }
      </div>
    }</div>
    </Modal>
};

export default Component