import { Capacitor } from '@capacitor/core';

export function registerPwaServiceWorker() {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;
  if (Capacitor.isNativePlatform()) return;

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
    // PWA support is optional; registration failure must not block the app.
    if (import.meta.env.DEV) console.warn('[PWA] Service worker registration failed:', error);
  });
}
