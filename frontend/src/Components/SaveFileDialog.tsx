import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import {useMutation, useQuery, useLazyQuery} from '@apollo/react-hooks';
import { Modal, Button, Input } from 'antd';

const Component = () => {
  const {saveFileDialogVisible, project, saveNewFile} = useMappedState((state:IStoreState)=>({
    saveFileDialogVisible: state.componentVisible.saveFileDialogVisible,
    project: state.currentProject,
    saveNewFile: state.componentVisible.saveFileDialogNewFile
  }));
  const dispatch = useDispatch();

  const [fileName, setFileName] = useState(project.name);

  const [saveProject, {data}] = useMutation(gql`
    mutation SaveProject($project: ProjectInput) {
      saveProject(project: $project) {
        success
      }
    }
  `);

  const handleOpenDialogOk = async ()=>{
    const projectForm = {
      _id: saveNewFile ? undefined : project._id,
      name: fileName,
      parts: project.parts.map((part)=>( part._id ? {_id: part._id} : {
        featureType: part.featureType,
        species: part.species,
        len: part.len,
        strand: part.strand,
        name: part.name,
        origin: part.origin && (part.origin as IAnnotationPart)._id ? (part.origin as IAnnotationPart)._id : part.origin 
      }))
    };

    await saveProject({variables: {project: projectForm}});
    dispatch({type:'HIDE_SAVE_FILE_DIALOG'})
  }

  const handleOpenDialogCancel = () => {
    dispatch({type:'HIDE_SAVE_FILE_DIALOG'})
  }

  return <div><Modal
      title="Open File"
      visible={saveFileDialogVisible}
      onOk={handleOpenDialogOk}
      onCancel={handleOpenDialogCancel}
    >
      <div>
        {fileName}
        <Input value={fileName} onChange={(event)=>setFileName(event.target.value)} />
      </div>
    </Modal>
    </div>
};

export default Component