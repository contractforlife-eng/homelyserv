import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2, Loader2, MapPin, PauseCircle, ShieldCheck, Smartphone } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import RolePageHeader from '../components/common/RolePageHeader';
import useAuthStore from '../store/authStore';
import { API_BASE } from '../config/api';
import { disableFamilyTracking, getFamilyTrackingStatus, pauseFamilyTracking, requestFamilyTrackingActivation } from '../services/parentStudentService';
import {
  activateNativeTracking, getNativeTrackingStatus, isAndroidFamilyTrackingAvailable,
  openBackgroundTrackingSettings, requestForegroundTrackingPermissions,
  requestSupportingTrackingPermissions, stopNativeTracking
} from '../native/familyTracking';

const StudentFamilyTracking = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const studentId = user?.id || user?._id;
  const android = isAndroidFamilyTrackingAvailable();
  const [status, setStatus] = useState(null);
  const [nativeStatus, setNativeStatus] = useState(null);
  const [challenge, setChallenge] = useState('');
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!studentId) return;
    try {
      const response = await getFamilyTrackingStatus(studentId);
      const serverStatus = response.status;
      setStatus(serverStatus);

      // Hydrate consent from server state if student already consented or is activated
      if (serverStatus?.consentAt || ['AWAITING_AGE_SAFEGUARD', 'AWAITING_NATIVE_VERIFICATION', 'ACTIVE', 'PAUSED'].includes(serverStatus?.activationState)) {
        setConsented(true);
      }

      if (android) {
        try {
          const natStatus = await getNativeTrackingStatus();
          setNativeStatus(natStatus);
        } catch {
          // Native bridge status error shouldn't crash the entire screen
        }
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t('familyTracking.errRequiresGuardian'));
    }
  }, [android, studentId, t]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const onResume = () => {
      refresh();
    };
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => {
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, [refresh]);

  const begin = async () => {
    if (busy) return;
    if (!android) {
      setError(t('familyTracking.androidOnlyNotice'));
      return;
    }
    if (!consented) {
      setError(t('familyTracking.consentRequiredNotice'));
      return;
    }

    setBusy(true); setError(''); setNotice('');
    try {
      const activation = await requestFamilyTrackingActivation(studentId, {
        consentVersion: 'family-tracking-v1',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: 'android'
      });
      setChallenge(activation.challenge);
      await requestForegroundTrackingPermissions();
      await requestSupportingTrackingPermissions();
      setNotice(activation.activationState === 'AWAITING_AGE_SAFEGUARD'
        ? t('familyTracking.safeguardNotice')
        : t('familyTracking.startingNotice'));
      await refresh();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || t('familyTracking.errGenericStart'));
    } finally { setBusy(false); }
  };

  const activationErrorMessages = {
    'PRODUCTION_DEVICE_ATTESTATION_REQUIRED': t('familyTracking.errProductionAttestationRequired'),
    'ACTIVATION_NOT_READY': t('familyTracking.errActivationNotReady'),
    'NATIVE_KEY_MISMATCH': t('familyTracking.errNativeKeyMismatch'),
    'INVALID_NATIVE_SIGNATURE': t('familyTracking.errInvalidNativeSignature'),
    'INVALID_NATIVE_PROOF': t('familyTracking.errInvalidNativeProof'),
  };

  const verifyAndStart = async () => {
    if (busy) return;
    if (!android) {
      setError(t('familyTracking.androidOnlyNotice'));
      return;
    }

    setBusy(true); setError(''); setNotice('');
    try {
      const permissions = await getNativeTrackingStatus();
      setNativeStatus(permissions);
      if (!permissions.foregroundPermission) {
        throw new Error(t('familyTracking.errForegroundRequired'));
      }
      if (!permissions.backgroundPermission) {
        throw new Error(t('familyTracking.errBackgroundRequired'));
      }
      if (!permissions.notificationPermission) {
        throw new Error(t('familyTracking.errNotificationsRequired'));
      }
      let nativeChallenge = challenge;
      if (!nativeChallenge) {
        const activation = await requestFamilyTrackingActivation(studentId, {
          consentVersion: 'family-tracking-v1',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: 'android'
        });
        if (activation.activationState === 'AWAITING_AGE_SAFEGUARD') {
          throw new Error(t('familyTracking.errSafeguardRequired'));
        }
        nativeChallenge = activation.challenge;
        setChallenge(nativeChallenge);
      }
      await activateNativeTracking({ studentId, token, apiBase: API_BASE, challenge: nativeChallenge });
      setNotice(t('familyTracking.activeNotice'));
      await refresh();
    } catch (activationError) {
      // Surface backend error codes through the native bridge
      const errorCode = activationError?.code || activationError?.response?.data?.code;
      const backendMessage = activationErrorMessages[errorCode];
      setError(backendMessage || activationError?.message || t('familyTracking.errVerificationFailed'));
    } finally { setBusy(false); }
  };

  const stop = async (disable) => {
    if (busy) return;
    // For pause action, verify that tracking is actually active or paused
    if (!disable && status?.activationState !== 'ACTIVE') {
      setNotice('');
      setError(t('familyTracking.pauseUnavailableNotice'));
      return;
    }

    setBusy(true); setError('');
    try {
      if (disable) await disableFamilyTracking(studentId); else await pauseFamilyTracking(studentId);
      if (android) await stopNativeTracking();
      if (disable) { setChallenge(''); setConsented(false); }
      setNotice(disable ? t('familyTracking.disabledNotice') : t('familyTracking.pausedNotice'));
      await refresh();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || t('familyTracking.errStopFailed'));
    } finally { setBusy(false); }
  };

  const handleOpenSettings = async () => {
    if (!android) {
      setError(t('familyTracking.androidOnlyNotice'));
      return;
    }
    try {
      await openBackgroundTrackingSettings();
    } catch (openError) {
      setError(openError?.message || t('familyTracking.errForegroundRequired'));
    }
  };

  const getSafeguardLabel = (code) => {
    switch (code) {
      case 'GUARDIAN_APPROVED':
        return t('familyTracking.safeguardApproved');
      case 'VERIFIED_ADULT':
        return t('familyTracking.safeguardAdult');
      case 'REQUIRED':
        return t('familyTracking.safeguardRequired');
      default:
        return code || t('familyTracking.safeguardRequired');
    }
  };

  const getServerStateLabel = (state) => {
    switch (state) {
      case 'ACTIVE':
        return t('familyTracking.statusActive');
      case 'PAUSED':
        return t('familyTracking.statusPaused');
      case 'AWAITING_NATIVE_VERIFICATION':
        return t('familyTracking.statusAwaitingNative');
      case 'AWAITING_AGE_SAFEGUARD':
        return t('familyTracking.statusAwaitingSafeguard');
      case 'DISABLED':
        return t('familyTracking.statusNotActivated');
      default:
        return state || t('familyTracking.statusUnavailable');
    }
  };

  return (
    <DashboardLayout><div className="space-y-6">
      <RolePageHeader title={t('familyTracking.studentTitle')} subtitle={t('familyTracking.studentSubtitle')} icon={MapPin} />
      {!android && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">{t('familyTracking.androidOnlyNotice')}</div>}
      {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"><AlertCircle className="shrink-0" /><span>{error}</span></div>}
      {notice && <div className="flex gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-900 dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200"><CheckCircle2 className="shrink-0" /><span>{notice}</span></div>}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-4"><ShieldCheck className="shrink-0 text-teal-600" /><div>
          <h2 className="font-bold text-gray-900 dark:text-white">{t('familyTracking.visibleActivationTitle')}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('familyTracking.visibleActivationDesc1')}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('familyTracking.visibleActivationDesc2')}</p>
        </div></div>
        <label className="mt-5 flex items-start gap-3 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={consented}
            onChange={(event) => {
              setConsented(event.target.checked);
              if (error === t('familyTracking.consentRequiredNotice')) setError('');
            }}
            className="mt-1"
          />
          <span>{t('familyTracking.consentLabel')}</span>
        </label>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <Smartphone className="mb-3 text-red-600" />
          <p className="text-xs font-semibold uppercase text-gray-500">{t('familyTracking.serverState')}</p>
          <p className="font-bold dark:text-white">{getServerStateLabel(status?.activationState)}</p>
          <p className="text-sm text-gray-500">{t('familyTracking.safeguard')}: {getSafeguardLabel(status?.ageSafeguardStatus)}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <MapPin className="mb-3 text-teal-600" />
          <p className="text-xs font-semibold uppercase text-gray-500">{t('familyTracking.androidPermissions')}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('familyTracking.foreground')}: {nativeStatus?.foregroundPermission ? t('familyTracking.granted') : t('familyTracking.notGranted')} · {t('familyTracking.background')}: {nativeStatus?.backgroundPermission ? t('familyTracking.granted') : t('familyTracking.notGranted')} · {t('familyTracking.notifications')}: {nativeStatus?.notificationPermission ? t('familyTracking.granted') : t('familyTracking.notGranted')}
          </p>
          <p className="text-xs text-gray-500">{t('familyTracking.encryptedQueue')}: {nativeStatus?.queueSize || 0}</p>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={begin}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          <span>{t('familyTracking.beginActivation')}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={handleOpenSettings}
          className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {t('familyTracking.openSettings')}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={verifyAndStart}
          className="inline-flex items-center gap-2 rounded-xl border border-teal-600 px-5 py-3 font-bold text-teal-700 transition hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-950/30 disabled:opacity-50"
        >
          {busy ? <Loader2 className="animate-spin" size={18} /> : null}
          <span>{t('familyTracking.verifyAndStart')}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => stop(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-amber-500 px-5 py-3 font-bold text-amber-700 transition hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30 disabled:opacity-50"
        >
          <PauseCircle size={18} />
          <span>{t('familyTracking.pause')}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => stop(true)}
          className="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-300 dark:hover:bg-red-950/30 disabled:opacity-50"
        >
          {t('familyTracking.disableAndClear')}
        </button>
      </div>
    </div></DashboardLayout>
  );
};

export default StudentFamilyTracking;
