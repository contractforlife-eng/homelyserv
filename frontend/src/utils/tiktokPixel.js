import { Capacitor } from '@capacitor/core';
import { getTrackingConsent, hasTrackingConsent, subscribeTrackingConsent } from './trackingConsent';

export const TIKTOK_PIXEL_ID = 'DA608RRC77UC1JSQRKEG';

const INITIALIZED_KEY = '__homelyServTikTokPixelInitialized';
let consentUnsubscribe;

const canLoadTikTokPixel = () => (
  import.meta.env.PROD === true
  && !Capacitor.isNativePlatform()
  && hasTrackingConsent()
);

const loadTikTokPixel = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined' || !canLoadTikTokPixel()) {
    return false;
  }

  if (window[INITIALIZED_KEY]) return true;

  window.TiktokAnalyticsObject = 'ttq';
  const ttq = window.ttq = window.ttq || [];
  const methods = [
    'page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once',
    'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent',
    'revokeConsent', 'grantConsent'
  ];

  ttq.setAndDefer = (target, method) => {
    target[method] = (...args) => target.push([method, ...args]);
  };

  methods.forEach((method) => {
    if (typeof ttq[method] !== 'function') ttq.setAndDefer(ttq, method);
  });

  ttq.load = (pixelId) => {
    ttq._i = ttq._i || {};
    ttq._i[pixelId] = [];
    ttq._i[pixelId]._u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
    ttq._t = ttq._t || {};
    ttq._t[pixelId] = +new Date();
    ttq._o = ttq._o || {};
    ttq._o[pixelId] = {};

    const script = document.createElement('script');
    script.async = true;
    script.src = `${ttq._i[pixelId]._u}?sdkid=${pixelId}&lib=ttq`;
    document.head.appendChild(script);
  };

  ttq.load(TIKTOK_PIXEL_ID);
  ttq.page();
  window[INITIALIZED_KEY] = true;
  return true;
};

export const initializeTikTokPixel = () => {
  if (typeof window === 'undefined') return;

  if (!consentUnsubscribe) {
    consentUnsubscribe = subscribeTrackingConsent((consent) => {
      if (consent === 'accepted') loadTikTokPixel();
    });
  }

  if (getTrackingConsent() === 'accepted') loadTikTokPixel();
};

export const trackTikTokCompleteRegistration = () => {
  console.info('[TikTok] CompleteRegistration requested');

  try {
    if (import.meta.env.PROD !== true) {
      console.info('[TikTok] CompleteRegistration queued=NO reason=non-production');
      return false;
    }

    if (Capacitor.isNativePlatform()) {
      console.info('[TikTok] CompleteRegistration queued=NO reason=native-capacitor');
      return false;
    }

    if (!hasTrackingConsent()) {
      console.info('[TikTok] CompleteRegistration queued=NO reason=consent-not-granted');
      return false;
    }

    if (!loadTikTokPixel()) {
      console.info('[TikTok] CompleteRegistration queued=NO reason=pixel-not-ready');
      return false;
    }

    if (typeof window.ttq?.track !== 'function') {
      console.info('[TikTok] CompleteRegistration queued=NO reason=ttq-unavailable');
      return false;
    }

    // Deliberately send no event parameters or user-identifying data.
    window.ttq.track('CompleteRegistration');
    console.info('[TikTok] CompleteRegistration queued=YES');
    return true;
  } catch {
    console.info('[TikTok] CompleteRegistration queued=NO reason=tracking-error');
    return false;
  }
};
