import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Fingerprint, Loader2, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';
import { isAvailable, isEnabled } from '../../native/biometricUnlock';

const BiometricUnlockSettings = () => {
  const { t } = useTranslation();
  const enableBiometricUnlock = useAuthStore((state) => state.enableBiometricUnlock);
  const disableBiometricUnlock = useAuthStore((state) => state.disableBiometricUnlock);
  const [availability, setAvailability] = useState(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return undefined;

    let active = true;
    Promise.all([isAvailable(), isEnabled()])
      .then(([availableState, enabledState]) => {
        if (!active) return;
        setAvailability(availableState);
        setEnabled(Boolean(enabledState?.enabled));
      })
      .catch(() => {
        if (active) setAvailability({ hardwareAvailable: false });
      });

    return () => {
      active = false;
    };
  }, []);

  if (Capacitor.getPlatform() !== 'android' || availability?.hardwareAvailable === false) {
    return null;
  }

  if (!availability) {
    return null;
  }

  const hasEnrollment = availability.enrolled || availability.available || enabled;

  const handleToggle = async () => {
    setBusy(true);
    setMessage(null);

    if (!enabled) {
      const result = await enableBiometricUnlock();
      if (result.success) {
        setEnabled(true);
      } else {
        setMessage(result.error || t('biometricUnlock.enableFailed'));
      }
    } else {
      const result = await disableBiometricUnlock();
      if (result.success) {
        setEnabled(false);
      } else {
        setMessage(result.error || t('biometricUnlock.disableFailed'));
      }
    }

    setBusy(false);
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {enabled ? (
            <ShieldCheck size={20} className="mt-0.5 text-green-600" />
          ) : (
            <Fingerprint size={20} className="mt-0.5 text-amber-600" />
          )}
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">{t('biometricUnlock.title')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('biometricUnlock.description')}</p>
            <p className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
              {enabled ? t('biometricUnlock.enabled') : t('biometricUnlock.enable')}
            </p>
            {!hasEnrollment && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{t('biometricUnlock.noEnrollment')}</p>
            )}
            {message && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{message}</p>}
          </div>
        </div>
        {hasEnrollment && (
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            aria-pressed={enabled}
            aria-label={enabled ? t('biometricUnlock.disable') : t('biometricUnlock.enable')}
            className={`relative h-6 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'} ${busy ? 'cursor-wait opacity-60' : ''}`}
          >
            {busy ? (
              <Loader2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" />
            ) : (
              <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? 'right-1' : 'left-1'}`} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BiometricUnlockSettings;
