import React, { useCallback, useEffect, useState } from 'react';
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
      setStatus(response.status);
      if (android) setNativeStatus(await getNativeTrackingStatus());
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Tracking requires an active linked guardian.');
    }
  }, [android, studentId]);

  useEffect(() => { refresh(); }, [refresh]);

  const begin = async () => {
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
        ? 'A linked guardian must approve the age safeguard before activation can finish.'
        : 'Now grant “Allow all the time” from Android App permissions, then verify and start.');
      await refresh();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Activation could not start.');
    } finally { setBusy(false); }
  };

  const verifyAndStart = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const permissions = await getNativeTrackingStatus();
      setNativeStatus(permissions);
      if (!permissions.backgroundPermission || !permissions.notificationPermission) {
        throw new Error('Background location and notification permissions are required.');
      }
      let nativeChallenge = challenge;
      if (!nativeChallenge) {
        const activation = await requestFamilyTrackingActivation(studentId, {
          consentVersion: 'family-tracking-v1',
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: 'android'
        });
        if (activation.activationState === 'AWAITING_AGE_SAFEGUARD') throw new Error('Guardian approval is still required.');
        nativeChallenge = activation.challenge;
        setChallenge(nativeChallenge);
      }
      await activateNativeTracking({ studentId, token, apiBase: API_BASE, challenge: nativeChallenge });
      setNotice('Tracking is active. Android displays a persistent notification while collection runs.');
      await refresh();
    } catch (activationError) {
      setError(activationError?.message || 'Native verification failed. Tracking remains disabled.');
    } finally { setBusy(false); }
  };

  const stop = async (disable) => {
    setBusy(true); setError('');
    try {
      if (disable) await disableFamilyTracking(studentId); else await pauseFamilyTracking(studentId);
      if (android) await stopNativeTracking();
      if (disable) { setChallenge(''); setConsented(false); }
      setNotice(disable ? 'Tracking is disabled and the encrypted device queue was cleared.' : 'Tracking is paused and the encrypted device queue was cleared.');
      await refresh();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Tracking could not be stopped.');
    } finally { setBusy(false); }
  };

  return (
    <DashboardLayout><div className="space-y-6">
      <RolePageHeader title="Family Tracking on this device" subtitle="You control when location collection runs" icon={MapPin} />
      {!android && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">Collection can only be activated in the HomelyServ Android app.</div>}
      {error && <div className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><AlertCircle />{error}</div>}
      {notice && <div className="flex gap-2 rounded-xl border border-teal-200 bg-teal-50 p-4 text-teal-900"><CheckCircle2 />{notice}</div>}
      <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex gap-4"><ShieldCheck className="shrink-0 text-teal-600" /><div>
          <h2 className="font-bold text-gray-900 dark:text-white">Visible, explicit activation</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">When active, GPS observations are sent to approved guardians and may be collected in the background. Android always shows a persistent notification. Sampling is adaptive and is not guaranteed continuous or real-time.</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Students under 18, or without a verified birth date, require explicit approval from an active linked guardian.</p>
        </div></div>
        <label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="mt-1" /><span>I understand and choose to start the Android permission and activation process.</span></label>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><Smartphone className="mb-3 text-red-600" /><p className="text-xs font-semibold uppercase text-gray-500">Server state</p><p className="font-bold dark:text-white">{status?.activationState || 'Unavailable'}</p><p className="text-sm text-gray-500">Safeguard: {status?.ageSafeguardStatus || 'REQUIRED'}</p></div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800"><MapPin className="mb-3 text-teal-600" /><p className="text-xs font-semibold uppercase text-gray-500">Android permissions</p><p className="text-sm text-gray-600 dark:text-gray-300">Foreground: {nativeStatus?.foregroundPermission ? 'Granted' : 'Not granted'} · Background: {nativeStatus?.backgroundPermission ? 'Granted' : 'Not granted'} · Notifications: {nativeStatus?.notificationPermission ? 'Granted' : 'Not granted'}</p><p className="text-xs text-gray-500">Encrypted queue: {nativeStatus?.queueSize || 0}</p></div>
      </section>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={!consented || busy || !android} onClick={begin} className="rounded-xl bg-red-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="animate-spin" /> : 'Begin activation'}</button>
        <button type="button" disabled={busy || !android} onClick={openBackgroundTrackingSettings} className="rounded-xl bg-teal-600 px-5 py-3 font-bold text-white">Open Android permission settings</button>
        <button type="button" disabled={busy || !android} onClick={verifyAndStart} className="rounded-xl border border-teal-600 px-5 py-3 font-bold text-teal-700">Verify and start</button>
        <button type="button" disabled={busy} onClick={() => stop(false)} className="flex items-center gap-2 rounded-xl border border-amber-500 px-5 py-3 font-bold text-amber-700"><PauseCircle size={18} />Pause</button>
        <button type="button" disabled={busy} onClick={() => stop(true)} className="rounded-xl border border-red-300 px-5 py-3 font-bold text-red-700">Disable and clear</button>
      </div>
    </div></DashboardLayout>
  );
};

export default StudentFamilyTracking;
