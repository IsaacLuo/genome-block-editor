import React from 'react';
import './App.css';
import styled from 'styled-components';
import Block from './Components/Block'

const App: React.FC = () => {
  const [count,setCount] = React.useState(0);
  return (
    <div className="App">
      <div style={{display:'flex'}}>
      <Block>001</Block>
      <Block>002</Block>
      <Block>003</Block>
      </div>
    </div>
  );
}

export default App;
