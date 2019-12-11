import * as React from 'react'
import {useDispatch, useMappedState} from 'redux-react-hook';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import {useMutation} from '@apollo/react-hooks';

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
  const onClickSaveProject = ()=>{
    const projectSaveForm = {
      _id: project._id,
      name: project.name,
      parts: project.parts.map((part)=>( part._id ? {_id: part._id} : {
        featureType: part.featureType,
        species: part.species,
        len: part.len,
        strand: part.strand,
        name: part.name,
        origin: part.origin && (part.origin as IAnnotationPart)._id ? (part.origin as IAnnotationPart)._id : part.origin 
      }))
    }
    console.log(projectSaveForm);
    saveProject({variables: {project:projectSaveForm,}});
    console.log(data);
  }

  const onClickExportGenbank = ()=>{
    dispatch({type:'EXPORT_GENBANK'});
  }
  return <React.Fragment>
    <div><a onClick={onClickSaveProject}>save project</a></div> 
    <div><a onClick={onClickExportGenbank}>export genbank</a></div>
  </React.Fragment>;
};

export default Component