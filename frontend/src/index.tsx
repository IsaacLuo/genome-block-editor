import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import {StoreContext} from 'redux-react-hook';
import {createStore, applyMiddleware} from 'redux';
import {reducer} from './reducer';
import saga from './saga';
import createSagaMiddleware from 'redux-saga';

// const store = createStore(reducer);
/* eslint-disable no-underscore-dangle */
// const store = createStore(
//   reducer, /* preloadedState, */
//   (window as any).__REDUX_DEVTOOLS_EXTENSION__ && (window as any).__REDUX_DEVTOOLS_EXTENSION__()
// );
const sagaMiddleware = createSagaMiddleware();
let middleWare: any;
if (process.env.NODE_ENV === 'development') {
  const composeEnhancers = ((window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, traceLimit: 25 })) || ((f: any) => f);
  middleWare = composeEnhancers(applyMiddleware(sagaMiddleware));
} else {
  middleWare = applyMiddleware(sagaMiddleware);
}

const store = createStore(
    reducer,
    middleWare,
  );
sagaMiddleware.run(saga);

/* eslint-enable */

ReactDOM.render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>
, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
