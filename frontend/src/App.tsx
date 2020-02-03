import React from 'react';
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

import conf from 'conf';


const client = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
});

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
    <div className="App">
      <Router>
        <Route path='/' exact component={MainPage}/>
        <Route path="/block_editor" component={BlockEditor}/>
      </Router>
    </div>
    </ApolloProvider>
  );
}

export default App;
