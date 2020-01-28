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
import conf from 'conf';


const client = new ApolloClient({
  uri: `${conf.backendURL}/graphql`,
});

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
    <div className="App">
      <div className="main-panel">
        
        <FileExplorer/>
        <div className="basket-panel">
          <GenomeBrowser/>
          <GenomeBrowserTooltip/>
        </div>
        <div className="project-basket">
          <div style={{flex:7}}>
            <ProjectBasket/>
          </div>
          <div style={{flex:3, background:'#fcec72', borderWidth:1}}>
            <ProjectOperationPanel/>
          </div>
        </div>
        <ResultSequence/>
      </div>
    </div>
    </ApolloProvider>
  );
}

export default App;
