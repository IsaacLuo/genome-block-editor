import React from 'react';
import './App.css';
import ProjectBasket from 'Components/ProjectBasket'
import FileList from 'Components/FileList'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'
import ProjectOperationPanel from 'Components/ProjectOperationPanel'

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
        <div className="file-panel">
          <FileList/>
        </div>
        <div className="basket-panel">
          {/* <ChromosomePanel/> */}
          <GenomeBrowser/>
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
