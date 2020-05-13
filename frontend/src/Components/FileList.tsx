import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import axios from 'axios';
import conf from 'conf.json';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import { FolderOutlined, FileOutlined } from '@ant-design/icons';
import styles from "./FileList.module.scss";
import styled from 'styled-components';

const DateTag = styled.span`
  font-size:50%;
  color: #777799;
  margin-left: 5px;
`;

const client = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
});

interface IProps {
  id:string,
  level: number,
}

const FileList = (props:IProps = {id:'000000000000000000000000', level:0}) => {
  const {id, level} = props;
  const dispatch = useDispatch();

  const fetchFile = async (_id:string) => {
    dispatch({type:'LOAD_SOURCE_FILE', data: _id});
  }

  const fetchFolder = async(_id:string) => {
    dispatch({type:'SET_FILE_LIST_LEVEL', data: {_id, level}});
  }

  const {folderContent} = useMappedState((state:IStoreState)=>({
    folderContent: state.fileExplorer.folderContent[id],
  }));

  if(!folderContent) {
    return <div className = {styles.FileList}>
      no content
    </div>
  }

  return (
    <div className = {styles.FileList}>
      {folderContent.subFolders.map((v:any,i:number)=>
      <div key={i} className={styles.Row}
        style={{cursor:'zoom-in'}}
        onClick={event=>fetchFolder(v._id)}
      >
        <FolderOutlined />
        {v.name}
      </div>)}
      {folderContent.projects.map((v:any,i:number)=>
      <div key={i} className={styles.Row}
        style={{cursor:'zoom-in'}}
        onClick={event=>fetchFile(v._id)}
      ><FileOutlined />
        {v.name}
        <DateTag>
          {new Date(parseInt(v.updatedAt)).toLocaleDateString()}
        </DateTag>
      </div>)}
    </div>
  );
};

export default FileList