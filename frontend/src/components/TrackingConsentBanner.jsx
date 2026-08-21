import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getTrackingConsent, setTrackingConsent, subscribeTrackingConsent } from '../utils/trackingConsent';

export default function TrackingConsentBanner() {
  const { t } = useTranslation();
  const [consent, setConsent] = useState(getTrackingConsent);

  useEffect(() => {
    return subscribeTrackingConsent(setConsent);
  }, []);

  if (consent !== 'unknown') return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="dialog" aria-label={t('trackingConsent.title')}>
      <div className="mx-auto flex max-w-5xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">{t('trackingConsent.title')}</p>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{t('trackingConsent.description')}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => setTrackingConsent('rejected')} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">{t('trackingConsent.reject')}</button>
          <button type="button" onClick={() => setTrackingConsent('accepted')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">{t('trackingConsent.accept')}</button>
        </div>
      </div>
    </div>
  );
}
