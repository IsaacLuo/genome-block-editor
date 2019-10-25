import React from 'react';
import './App.css';
// import styled from 'styled-components';
import ProjectBasket from 'Components/ProjectBasket'
import FileList from 'Components/FileList'

const App: React.FC = () => {
  const [count,setCount] = React.useState(0);

  return (
    <div className="App">
      <div className="main-panel">
        <div className="file-panel">
          <FileList/>
        </div>
        <div className="basket-panel">
          <ProjectBasket/>
        </div>
        <div className="basket-panel">
          <ProjectBasket/>
        </div>
      </div>
    </div>
  );
}

export default App;
