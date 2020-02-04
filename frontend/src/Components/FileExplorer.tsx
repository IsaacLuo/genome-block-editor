import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import useDimensions from 'react-use-dimensions';
import FileList from './FileList'
import styles from './FileExplorer.module.scss'


const FileExplorer = () => {
  const {
    fileLists, 
    } = useMappedState((state:IStoreState)=>({
      fileLists: state.fileExplorer.fileLists,
  }));

  const [ref, {width }] = useDimensions();
  // const myFileLists = fileLists.length>3?fileLists.slice(fileLists.length-3,fileLists.length):fileLists;
  const historyNumber = Math.floor((width - 400)/100)
  return (<div className={styles.FileExplorer} ref={ref}>
      {fileLists.map((v,i)=>({v,i}))
        .filter(v=>v.i >= fileLists.length - historyNumber || v.i === fileLists.length - 1)
        .map(({v,i})=>
        <FileList key={i} id={v._id} level={i}/>
      )}
    </div>
  );
};

export default FileExplorer