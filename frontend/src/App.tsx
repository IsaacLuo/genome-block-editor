import React from 'react';
import './App.css';
import ProjectBasket from 'Components/ProjectBasket'
import FileList from 'Components/FileList'
import ChromosomePanel from 'Components/ChormosomePanel'
import ResultSequence from 'Components/ResultPanel'

const App: React.FC = () => {
  return (
    <div className="App">
      <div className="main-panel">
        <div className="file-panel">
          <FileList/>
        </div>
        <div className="basket-panel">
          <ChromosomePanel/>
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
