import React, { useState, useEffect } from 'react';
import { useDispatch } from "redux-react-hook";
import axios from 'axios';
import conf from 'conf';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";
import { Icon } from 'antd';
import styles from "./FileList.module.scss";

const client = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
});

interface IProps {
  id?:string,
  level: number,
}

const FileList = (props:IProps = {id:undefined, level:0}) => {
  const {id, level} = props;
  const [folder, setFolder] = useState({_id:undefined, name:'', subFolders:[], projects:[]});
  const dispatch = useDispatch();

  const requestFiles = async () => {
    try {
      const result = await client.query({
        query: gql`
        {
          folder${id?`(_id:"${id}")`:''}{
              _id
              name
              subFolders {
                _id
                name
              }
              projects {
                _id
                name
              }
            }
          }
        `
      })
      const {folder} = result.data;
      setFolder(folder);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(()=> {
    requestFiles();
  },[id]);

  const fetchFile = async (_id:string) => {
    dispatch({type:'SET_GENOME_BROWSER_LOADING', data:true});
    const result = await client.query({
      query: gql`
      {
        sourceFile(_id:"${_id}") {
          _id
          name
          len
          parts {
            _id
            name
            featureType
            species
            chrId
            chrName
            start
            end
            len
            strand
          }
          ctype
        }
      }
      `
    })
    dispatch({type:'SET_GENOME_BROWSER_LOADING', data:false});
    const {sourceFile} = result.data;
    dispatch({type:'SET_SOURCE_FILE', data: sourceFile,});
  }

  const fetchFolder = async(_id:string) => {
    dispatch({type:'SET_FILE_LIST_LEVEL', data: {_id, level}});
  }

  return (
    <div className = {styles.FileList}>
      {folder.subFolders.map((v:any,i:number)=>
      <div key={i} className={styles.Row}
        style={{cursor:'zoom-in'}}
        onClick={event=>fetchFolder(v._id)}
      >
        <Icon type="folder" />
        {v.name}
      </div>)}
      {folder.projects.map((v:any,i:number)=>
      <div key={i} className={styles.Row}
        style={{cursor:'zoom-in'}}
        onClick={event=>fetchFile(v._id)}
      ><Icon type="file" />
        {v.name}
      </div>)}
    </div>
  );
};

export default FileList