import React, { useEffect } from 'react';
import './App.css';
import ProjectBasket from 'Components/ProjectBasket'
import FileExplorer from 'Components/FileExplorer'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'
import ProjectOperationPanel from 'Components/ProjectOperationPanel'
import GenomeBrowserTooltip from 'Components/GenomeBrowserTooltip'

import { ApolloProvider } from '@apollo/react-hooks';
import ApolloClient from 'apollo-boost';
import 'antd/dist/antd.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import MainPage from './Pages/MainPage';
import BlockEditor from './Pages/BlockEditor';
import GenomeFunctions from './Pages/GenomeFunctions';

import conf from 'conf';
import { useMappedState, useDispatch } from 'redux-react-hook';
import UserBar from 'Components/UserBar';


const client = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
});

const App: React.FC = () => {

  const {
    currentUser, 
    } = useMappedState((state:IStoreState)=>({
      currentUser: state.app.currentUser,
  }));

  const dispatch = useDispatch();

  useEffect(()=>{
    if(currentUser.fullName === '') {
      dispatch({type:'GET_CURRENT_USER'});
    }
  },[]);

  return (
    <ApolloProvider client={client}>
    <div className="App">
      <Router>
        <UserBar/>
        <Route path='/' exact component={MainPage}/>
        <Route path="/block_editor" component={BlockEditor}/>
        <Route path="/genome_functions" component={GenomeFunctions}/>
      </Router>
    </div>
    </ApolloProvider>
  );
}

export default App;
