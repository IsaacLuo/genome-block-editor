
import React, { useState, useEffect } from 'react';
import {useDispatch, useMappedState} from 'redux-react-hook';
import { Modal, InputNumber, Progress, Button} from 'antd';
import styled from 'styled-components'
import { RouteComponentProps, Link } from 'react-router-dom';
import { Menu } from 'antd';
import conf from 'conf';
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

const UserBar = () => {
  const {currentUser} = useMappedState((state:IStoreState)=>({
    currentUser: state.app.currentUser,
  }));
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



  return (
    <UserBarContainer>
      {
        currentUser._id === ''
      ?
      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['1']}
        style={{ lineHeight: '66px' }}
      >
        <Menu.Item key="1"><Link to="/">Cailab-GBE</Link></Menu.Item>
        <Menu.Item key="2" onClick={onClickLogin}>
          login
        </Menu.Item>
      </Menu>
      
      :
      <Menu
        theme="dark"
        mode="horizontal"
        defaultSelectedKeys={['1']}
        style={{ lineHeight: '66px' }}
      >
        <Menu.Item key="1"><Link to="/">Cailab-GBE</Link></Menu.Item>
        <Menu.SubMenu style={{float: 'right'}} title={<span>{currentUser.fullName}<PortraitImg src='https://api.auth.cailab.org/api/user/current/portrait/s/profile.jpg'/></span>}>
          <Menu.Item key="2" onClick={onClickLogout}>logout</Menu.Item>
          
        </Menu.SubMenu>
    </Menu>
        
    }
    </UserBarContainer>
  );
}

export default UserBar;