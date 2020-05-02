
import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button} from 'antd';
import styled from 'styled-components'
import { RouteComponentProps, Link, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import conf from 'conf.json';
// const GUEST_ID = '000000000000000000000000';
const UserBarContainer = styled.div`
  background-color: #e9ecef;
  text-align:left;
`;
const PortraitImg = styled.img`
  margin:0px;
  margin-right:0px;
  border-radius: 50px;
`;

const HomeLogo = styled.div`
  background-color: #1890ff;
  color:#ffffff;
  display:inline-block;
  padding-left: 10px;
  padding-right: 10px;
`

const UserBar = () => {
  const state = useMappedState((state:IStoreState)=>({
    currentUser: state.app.currentUser,
    sourceFile: state.sourceFile,
  }));

  const location = useLocation();

  const dispatch = useDispatch();

  const onClickLogout = (evnet: any) => {
    dispatch({type: 'LOGOUT'})
    // this.props.history.push('/');
  }

  const onLogginWindowClosed = (messageEvent: MessageEvent) => {
    const {data} = messageEvent;
    console.log('login message', messageEvent);
    if (data.event === 'closed' && data.success === true) {
      
      dispatch({type:'CAILAB_INSTANCE_LOGIN'});
    }
    window.removeEventListener('message', onLogginWindowClosed);
  }

  const onClickLogin = (event: any) => {
    console.log('login....');
    const width = 400;
    const height = 600;
    const top = (window.screen.availHeight / 2) - (height / 2);
    const left = (window.screen.availWidth / 2) - (width / 2);

    window.addEventListener('message', onLogginWindowClosed, false);
    window.open(
      conf.authDialogURL,
      'cailablogin',
// tslint:disable-next-line: max-line-length
      `toolbar=no,location=no,status=no,menubar=no,scrollbar=yes,resizable=yes,width=${width},height=${height},top=${top},left=${left}`,
    );
  }

  let loginControl;
  let showOperationMenu;
  if(conf.localMode) {
    showOperationMenu = true;
    loginControl = (
      <Menu.Item style={{float: 'right'}}>local mode</Menu.Item>
    );
  } else if(state.currentUser._id === '') {
    showOperationMenu = false;
    loginControl = 
      <Menu.Item key="2" onClick={onClickLogin}>
        login
      </Menu.Item>
  } else {
    showOperationMenu = true;
    loginControl = 
    <React.Fragment>
      <Menu.Item key="1"><Link to="/">Cailab-GBE</Link></Menu.Item>
      <Menu.SubMenu style={{float: 'right'}} title={<span>{state.currentUser.fullName}<PortraitImg src='https://api.auth.cailab.org/api/user/current/portrait/s/profile.jpg'/></span>}>
        <Menu.Item key="2" onClick={onClickLogout}>logout</Menu.Item>
      </Menu.SubMenu>
    </React.Fragment>
  }

  showOperationMenu = showOperationMenu && /genome_functions/.test(location.pathname);

  const projectOperationChoice = [
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
  ];
  
  const globalEditingOerationChoice = [
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
  ]

  const filteredProjectOperationChoice = projectOperationChoice.filter(v=>v.visible(state));

  let projectOperations = <Menu.SubMenu title="Edit" disabled={filteredProjectOperationChoice.length === 0}>
    {
      filteredProjectOperationChoice
        .map((operation, i)=> (
          <Menu.Item onClick={operation.onClick}>
            {operation.name}
          </Menu.Item>
        ))
    }
    </Menu.SubMenu>

  const filteredGlobalOperationChoice = globalEditingOerationChoice.filter(v=>v.visible(state));

  let globalOperations = (
    <Menu.SubMenu title="Global Operations" disabled= {filteredGlobalOperationChoice.length === 0}>
      {filteredGlobalOperationChoice
      .map((operation, i)=> (
        <Menu.Item onClick={operation.onClick}>
          {operation.name}
        </Menu.Item>
      ))}
    </Menu.SubMenu>
  )

  return (
    <UserBarContainer>
      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['1']}
        style={{ lineHeight: '66px' }}
      >
        <HomeLogo><Link to="/" style={{color:'#ffffff'}}>Cailab-GBE</Link></HomeLogo>
        {showOperationMenu && projectOperations}
        {showOperationMenu && globalOperations}
        {loginControl}
      </Menu>
    </UserBarContainer>
  );
}

export default UserBar;