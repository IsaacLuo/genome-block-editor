import React from 'react';
import './App.css';
// import styled from 'styled-components';
import ProjectBasket from 'Components/ProjectBasket'

const App: React.FC = () => {
  const [count,setCount] = React.useState(0);

  return (
    <div className="App">
      <ProjectBasket/>
    </div>
  );
}

export default App;
