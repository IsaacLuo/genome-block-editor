
import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button, Card, Table} from 'antd';
import styled from 'styled-components'
import { RouteComponentProps, Link } from 'react-router-dom';
import { Menu } from 'antd';
import conf from 'conf.json';

const ProjectLogPanel = () => {
  const log = useMappedState((state:IStoreState)=>(state.projectLog.log));

  const dispatch = useDispatch();

  // const dataSource = log.parts?.map((v:any,i:number)=>({...v, key:i}));
  const dataSource = log.parts;

  // console.log(dataSource);
  if (!dataSource) return <div>no log</div>
  const columns = [
    {
      title: 'type',
      dataIndex: 'ctype',
      key: 'ctype',
      filters: [
        {
          text: 'new',
          value: 'new',
        },
        {
          text: 'modified',
          value: 'modified',
        },
        {
          text: 'deleted',
          value: 'deleted',
        },
        {
          text: 'shifted',
          value: 'shifted',
        },
        {
          text: 'conflict',
          value: 'conflict',
        },
      ],
      onFilter: (value:any, record:any) => record.ctype === value,
      // sorter: (a:any, b:any) => a.ctype < b.ctype ? -1 : 1,
      // sortDirections: ['descend'],
    },
    {
      title: 'name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a:any, b:any) => a.name === b.name ? 0 : a.name < b.name ? -1: 1,
    },
    {
      title: 'location',
      dataIndex: 'location',
      key: 'location',
      sorter: (a:any, b:any) => a.location - b.location,
      render: (location:number)=><a onClick={(event)=>{dispatch({type:'GENOME_BROWSER_SET_CURSOR_POS', data:location})}}>{location}</a>
    },
    {
      title: 'changelog',
      dataIndex: 'changelog',
      key: 'changelog',
    }
  ];
  
  // 'descend' | 'ascend' | null;
  return (
    <div style={{width:'100%'}}>
      <Table rowKey={record=>record.part} dataSource={dataSource} columns={columns}/>      
    </div>
  );
}

export default ProjectLogPanel;