/**
 * @Package: index.jsx
 * @Date   : Dec 15th, 2021
 * @Author : Xiao Ling   
 *
*/


import React from 'react';
import ReactDOM from 'react-dom';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom'
import { unregister } from './registerServiceWorker';

// app imports
import App from './App';
import './assets/index.css';


// important or redploys will not show up 
unregister();

// @Use: render the app 
ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
