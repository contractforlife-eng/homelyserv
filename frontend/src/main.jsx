<<<<<<< HEAD
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

=======
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)