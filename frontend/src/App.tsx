import React from 'react';
import './App.css';
import ProjectBasket from 'Components/ProjectBasket'
import FileList from 'Components/FileList'
import GenomeBrowser from 'Components/GenomeBrowser'
import ResultSequence from 'Components/ResultPanel'

const App: React.FC = () => {
  return (
    <div className="App">
      <div className="main-panel">
        <div className="file-panel">
          <FileList/>
        </div>
        <div className="basket-panel">
          {/* <ChromosomePanel/> */}
          <GenomeBrowser/>
        </div>
        <div className="basket-panel">
          <ProjectBasket/>
        </div>
        <ResultSequence/>
      </div>
    </div>
  );
}

export default App;
