import React, { useState, useEffect } from 'react';
import { useDispatch } from "redux-react-hook";
import axios from 'axios';
import { backendURL } from 'conf';
import ApolloClient from 'apollo-boost';
import { gql } from "apollo-boost";

const client = new ApolloClient({
  uri: 'http://localhost:8000/graphql',
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
    const result = await client.query({
      query: gql`
      {
        sourceFile(_id:"${_id}") {
          _id
          name
          parts {
            _id
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
    console.log(result.data)
    const {sourceFile} = result.data;
    dispatch({type:'SET_SOURCE_FILE', data: sourceFile,});
  }

  return (
    <div>
      {files.map((v:any,i:number)=>
      <div key={i}
        style={{cursor:'zoom-in'}}
        onClick={event=>fetchFile(v._id)}
      >{v.name}</div>)}
    </div>
  );
};

export default Component