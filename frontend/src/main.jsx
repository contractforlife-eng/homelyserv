// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const GOOGLE_CLIENT_ID = '165930731307-gsnppmt9p23ftdr8872kvf9ohr4p9ars.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App />
        <Toaster position="top-right" />
      </GoogleOAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);