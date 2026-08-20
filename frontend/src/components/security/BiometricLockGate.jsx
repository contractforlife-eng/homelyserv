import React from 'react';
import { Capacitor } from '@capacitor/core';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../../store/authStore';

const BiometricLockGate = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const biometricLocked = useAuthStore((state) => state.biometricLocked);
  const useNormalLogin = useAuthStore((state) => state.useNormalLogin);

  if (Capacitor.getPlatform() !== 'android' || !biometricLocked) {
    return null;
  }

  const handleNormalLogin = async () => {
    await useNormalLogin();
    navigate('/login', { replace: true });
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white dark:bg-gray-950 px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Fingerprint size={32} />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('biometricUnlock.lockedTitle')}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t('biometricUnlock.lockedDescription')}</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={16} className="animate-spin" />
          <span>{t('biometricUnlock.awaitingPrompt')}</span>
        </div>
        <button
          type="button"
          onClick={handleNormalLogin}
          className="mt-7 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
        >
          {t('biometricUnlock.useNormalLogin')}
        </button>
      </div>
    </div>
  );
};

export default BiometricLockGate;
