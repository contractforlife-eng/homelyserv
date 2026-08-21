import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTrackingConsent, setTrackingConsent, subscribeTrackingConsent } from '../utils/trackingConsent';

export default function TrackingConsentSettings() {
  const { t } = useTranslation();
  const [consent, setConsent] = useState(getTrackingConsent);

  useEffect(() => {
    return subscribeTrackingConsent(setConsent);
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-gray-700 dark:text-gray-300">{t('trackingConsent.preferenceTitle')}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('trackingConsent.preferenceDescription')}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">{t(`trackingConsent.status.${consent}`)}</span>
        <button type="button" onClick={() => setTrackingConsent('rejected')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-white dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('trackingConsent.disable')}</button>
        <button type="button" onClick={() => setTrackingConsent('accepted')} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">{t('trackingConsent.enable')}</button>
      </div>
    </div>
  );
}
