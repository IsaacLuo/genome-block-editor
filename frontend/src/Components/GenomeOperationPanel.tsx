import React from 'react';
import { Button } from 'antd';
import { useMappedState, useDispatch } from 'redux-react-hook';
import styled from 'styled-components';

const ButtonZone = styled.div`
margin-top: 20px;
`

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
          dispatch({type:'SHOW_FORK_PROJECT_DIALOG'});
        } else {
          console.error('FORK_PROJECT');
        }
      }
    },
    {
      name: 'export project',
      visible: (state:any) => state.sourceFile !== undefined ,
      onClick: ()=>{
        if (state.sourceFile) {
          dispatch({type:'EXPORT_SOURCE_FILE_TO_GFF_JSON'});
        } else {
          console.error('EXPORT_SOURCE_FILE_TO_GFF_JSON');
        }
      }
    },
    {
      name: 'create promoter terminator',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject'),
      onClick: ()=>{
        dispatch({type:'SHOW_CREATE_PROMOTER_TERMINATOR_DIALOG'})
      }
    },
    {
      name: 'remove non-gene annotations',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject'),
      onClick: ()=>{
        dispatch({type:'SHOW_REMOVE_CREATED_FEATURES_DIALOG'})
      }
    },
    {
      name: 'delete (hide) project',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject'),
      onClick: ()=>{
        dispatch({type:'DELETE_PROJECT'})
      }
    },
    {
      name: 'history versions',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype !== 'source'),
      onClick: ()=>{
        dispatch({type:'SHOW_HIDE_HISTORY_VERSIONS'})
      }
    },
    {
      name: 'revert',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject') && state.sourceFile.history.length > 0,
      onClick: ()=>{
        dispatch({type:'REVERT_TO_HISTORY_VERSION'})
      }
    },
    {
      name: 'replace codons',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject'),
      onClick: ()=>{
        dispatch({type:'SHOW_REPLACE_CODON_DIALOG'})
      }
    },
    {
      name: 'insert sequence',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject'),
      onClick: ()=>{
        dispatch({type:'SHOW_INSERT_FEATURE_DIALOG'})
      }
    },
    {
      name: 'remove intron',
      visible: (state:any) => state.sourceFile && (state.sourceFile.ctype === 'project' || state.sourceFile.ctype === 'flatProject'),
      onClick: ()=>{
        dispatch({type:'SHOW_REMOVE_INTRON_DIALOG'})
      }
    },

  ]

  return (
      <ButtonZone>
        {operations
          .filter(v=>v.visible(state))
          .map((operation, i)=>
            <Button key={i} onClick={operation.onClick}>{operation.name}</Button>
          )}
      </ButtonZone>
  );
}

export default GenomeOperationPanel;
