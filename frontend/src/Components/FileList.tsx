import React, { useState, useEffect } from 'react';
import { useDispatch } from "redux-react-hook";
import axios from 'axios';
import { backendURL } from 'conf';

const Component = () => {
  const [files, setFiles] = useState([]);
  const dispatch = useDispatch();

  const requestFiles = async () => {
    try {
      const response = await axios.get(backendURL + '/api/files');
      const files = response.data.files;
      setFiles(files);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(()=> {
    requestFiles();
  },[]);

  return (
    <div
      className="file-panel"
    >
      {files.map((v,i)=>
      <div key={i}
        onClick={async ()=>{
          const blocks = await axios.get(backendURL + `/api/file/${v}`);
          dispatch({type:'SET_BLOCKS', data: blocks});
        }}
      >{v}</div>)}
    </div>
  );
};

export default Component