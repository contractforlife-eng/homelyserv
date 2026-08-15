export const META_PIXEL_ID = '3837231463084823';

const INITIALIZED_KEY = '__homelyServMetaPixelInitialized';
const LAST_PAGE_VIEW_KEY = '__homelyServMetaPixelLastPageView';

const loadMetaPixel = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;

  if (!window.fbq) {
    const fbq = function (...args) {
      fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args);
    };

    window.fbq = fbq;
    window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.appendChild(script);
  }

  if (!window[INITIALIZED_KEY]) {
    window.fbq('init', META_PIXEL_ID);
    window[INITIALIZED_KEY] = true;
  }

  return true;
};

export const trackMetaPageView = (pageKey) => {
  if (!loadMetaPixel() || window[LAST_PAGE_VIEW_KEY] === pageKey) return;

  window[LAST_PAGE_VIEW_KEY] = pageKey;
  window.fbq('track', 'PageView');
};

export const trackCompleteRegistration = () => {
  if (!loadMetaPixel()) return;

  // Intentionally omit event parameters: no registration form data or PII.
  window.fbq('track', 'CompleteRegistration');
};
