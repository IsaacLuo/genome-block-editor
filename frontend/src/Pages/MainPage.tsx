import {Link} from 'react-router-dom';
import React, { useEffect } from 'react';
import { Button } from 'antd';
import styled from 'styled-components';
import { useMappedState, useDispatch } from 'redux-react-hook';
import conf from 'conf';

const Panel = styled.div`
  display:flex;
  align-items: center;
  justify-content: center;
  height:600px;
`;

const RectDiaglog = styled.div`
  width:400px;
  height:400px;
  border:solid 1px black;
  display:flex;
  flex-direction:column;
  align-items: center;
  justify-content: space-around;
`;

const Title = styled.h1`
  flex:2;
  display:flex;
  align-items: center;
  justify-content: center;
`;

const ButtomArea = styled.div`
  display:flex;
  flex-direction:column;
  align-items: center;
  justify-content: space-around;
  flex:1;
`;

const MainPage = () => {
  const {
    currentUser,
    } = useMappedState((state:IStoreState)=>({
    currentUser: state.app.currentUser,
  }));

  const dispatch = useDispatch();

  useEffect(()=>{
    dispatch({type:'GET_CURRENT_USER'})
  },[])

  const onLogginWindowClosed = (messageEvent: MessageEvent) => {
    console.log('loggedin from main page', messageEvent)
    const {data} = messageEvent;
    if (data.event === 'closed' && data.success === true) {
      dispatch({type:'GET_CURRENT_USER'})
    }
    window.removeEventListener('message', onLogginWindowClosed);
  }

  const onClickLogin = ()=>{
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

  if (currentUser._id) {
    return <Panel>
      <RectDiaglog>
        <div>{currentUser.fullName}</div>
      <div>
      <Button type="primary" size="large"><Link to="/genome_functions">genome functions</Link></Button>
      </div>
      <div>
      <Button type="primary" size="large"><Link to="/block_editor">block editor</Link></Button>
      </div>
      </RectDiaglog>
    </Panel>
  }
  else {
      return <Panel>
          <RectDiaglog>
          <Title>GENOME-BLOCK-EDITOR</Title>
          <ButtomArea>
            <div>{currentUser.fullName}</div>
            <Button type="primary" size="large" onClick={onClickLogin}>Login to Cailab</Button>
          </ButtomArea>
          </RectDiaglog>
      </Panel>
  }
}

export default MainPage;