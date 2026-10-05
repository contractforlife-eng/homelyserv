// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App';
import MetaPixelTracker from './components/MetaPixelTracker';
import TrackingConsentBanner from './components/TrackingConsentBanner';
import { AuthProvider } from './context/AuthContext';
import useThemeStore from './store/themeStore';
// Initialize i18n (single source of truth for all languages + RTL)
import './i18n';
// Country-based language selection (async, non-blocking, started below
// after the synchronous i18n init above has completed).
import { startCountryLanguageDetection } from './i18n/countryLanguage.js';
import './index.css';
import { registerPwaServiceWorker } from './pwa/registerServiceWorker';
import { initializeTikTokPixel } from './utils/tiktokPixel';

const GOOGLE_CLIENT_ID = '165930731307-gsnppmt9p23ftdr8872kvf9ohr4p9ars.apps.googleusercontent.com';

// Initialize global theme (dark mode) from persisted store before rendering
useThemeStore.getState().initializeTheme();

registerPwaServiceWorker();
initializeTikTokPixel();
// Country → language detection: fire-and-forget. Priority stays
// manual > country > browser > en, and any failure silently keeps the
// existing browser-language result. Never blocks rendering.
startCountryLanguageDetection();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MetaPixelTracker />
      <TrackingConsentBanner />
      <AuthProvider>
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <App />
          <Toaster position="top-right" />
        </GoogleOAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
