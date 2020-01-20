import React, { useState, useEffect } from 'react';
import { useDispatch } from "redux-react-hook";
import axios from 'axios';
import conf from 'conf';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";

const client = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
});

const Component = () => {
  const [files, setFiles] = useState([]);
  const dispatch = useDispatch();

  const requestFiles = async () => {
    try {
      const result = await client.query({
        query: gql`
        {
          sourceFiles {
              _id
              name
              len
            }
          }
        `
      })
      const {sourceFiles} = result.data;
      setFiles(sourceFiles);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(()=> {
    requestFiles();
  },[]);

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
        }
      }
      `
    })
    dispatch({type:'SET_GENOME_BROWSER_LOADING', data:false});
    const {sourceFile} = result.data;
    dispatch({type:'SET_SOURCE_FILE', data: sourceFile,});
  }

  return (
    <div>
      {files.map((v:any,i:number)=>
      <div key={i}
        style={{cursor:'zoom-in'}}
        onClick={event=>fetchFile(v._id)}
      >{v.name} ({v.len})</div>)}
    </div>
  );
};

export default Component