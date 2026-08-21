import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { trackMetaPageView } from '../utils/metaPixel';
import { getTrackingConsent, subscribeTrackingConsent } from '../utils/trackingConsent';

const MetaPixelTracker = () => {
  const location = useLocation();
  const [consent, setConsent] = useState(getTrackingConsent);
  const pageKey = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const handleConsentChange = (nextConsent) => {
      setConsent(nextConsent);
      if (nextConsent === 'accepted') trackMetaPageView(pageKey);
    };
    return subscribeTrackingConsent(handleConsentChange);
  }, [pageKey]);

  useEffect(() => {
    if (consent === 'accepted') {
      trackMetaPageView(pageKey);
    }
  }, [consent, pageKey]);

  return null;
};

export default MetaPixelTracker;
