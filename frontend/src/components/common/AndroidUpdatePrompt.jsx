import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useTranslation } from 'react-i18next';
import { Download, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { checkForAppUpdate, postponeUpdate } from '../../utils/appUpdateChecker';
import useAuthStore from '../../store/authStore';

// Actual existing dashboard role themes matching RolePageHeader and DashboardLayout:
// - WORKER / DOCTOR / TEACHER / STUDENT / SUPPORT_HELPER: Red theme ('bg-red-600 hover:bg-red-700 focus:ring-red-500')
// - EMPLOYER: Teal theme ('bg-teal-600 hover:bg-teal-700 focus:ring-teal-500')
// - ADMIN: Yellow/Amber dashboard theme ('bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500')
// - SUPPORT: Green theme ('bg-green-600 hover:bg-green-700 focus:ring-green-500')
const ROLE_THEMES = {
  WORKER: { primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  EMPLOYER: { primary: 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500', badge: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  DOCTOR: { primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  TEACHER: { primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  STUDENT: { primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  ADMIN: { primary: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500', badge: 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  SUPPORT: { primary: 'bg-green-600 hover:bg-green-700 focus:ring-green-500', badge: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  SUPPORT_HELPER: { primary: 'bg-red-600 hover:bg-red-700 focus:ring-red-500', badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

/**
 * AndroidUpdatePrompt
 * Displays a non-intrusive, role-themed dialog on native Android when a newer versionCode is published.
 * Triggers on launch and appStateChange (resume), deduplicated with a 24-hour reminder postponement.
 */
export default function AndroidUpdatePrompt() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore(s => s.user);
  const [updateInfo, setUpdateInfo] = useState(null);
  const isCheckingRef = useRef(false);
  const lastCheckedAtRef = useRef(0);

  const theme = ROLE_THEMES[user?.role] || {
    primary: 'bg-slate-800 hover:bg-slate-900 focus:ring-slate-600',
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };

  const performCheck = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return;
    const now = Date.now();
    // Throttle checks to once every 60 seconds across rapid resume events
    if (now - lastCheckedAtRef.current < 60000 || isCheckingRef.current) return;
    isCheckingRef.current = true;
    lastCheckedAtRef.current = now;

    try {
      const result = await checkForAppUpdate({
        isNativePlatform: () => Capacitor.isNativePlatform(),
        getInfo: () => App.getInfo(),
        storage: window.localStorage,
        timeoutMs: 3500,
      });
      if (result) {
        setUpdateInfo(result);
      }
    } catch (err) {
      // Missing internet, invalid manifests or server errors must never block app
      console.warn('[AppUpdate] Check skipped:', err?.message);
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Check on initial launch
    performCheck();

    // Check on app resume
    let stateListener = null;
    try {
      stateListener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          performCheck();
        }
      });
    } catch {
      // Ignore if listener not supported
    }

    return () => {
      if (stateListener && typeof stateListener.remove === 'function') {
        stateListener.remove();
      }
    };
  }, [performCheck]);

  const handleLater = () => {
    if (updateInfo?.latestCode) {
      postponeUpdate(updateInfo.latestCode, window.localStorage);
    }
    setUpdateInfo(null);
  };

  const handleDownload = () => {
    const downloadPageUrl = 'https://www.homelyserv.com/download';
    try {
      window.open(downloadPageUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = downloadPageUrl;
    }
    // Also postpone reminder so returning doesn't instantly re-prompt
    if (updateInfo?.latestCode) {
      postponeUpdate(updateInfo.latestCode, window.localStorage);
    }
    setUpdateInfo(null);
  };

  if (!updateInfo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-update-dialog-title"
      dir={i18n.dir()}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-100">
        <button
          onClick={handleLater}
          className="absolute top-4 end-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label={t('appUpdate.later') || 'Later'}
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 id="app-update-dialog-title" className="text-lg font-bold">
              {t('appUpdate.title') || 'Update available'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              HomelyServ for Android
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 leading-relaxed">
          {t('appUpdate.description') || 'A new version of HomelyServ is available. Update now to enjoy the latest features, wall improvements, and fixes.'}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700/50 text-xs">
          <div>
            <span className="text-gray-400 block mb-0.5">{t('appUpdate.installedLabel') || 'Installed'}</span>
            <span className="font-semibold text-gray-700 dark:text-gray-200">
              v{updateInfo.installedVersion} ({updateInfo.installedCode})
            </span>
          </div>
          <div>
            <span className="text-gray-400 block mb-0.5">{t('appUpdate.latestLabel') || 'Latest'}</span>
            <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
              v{updateInfo.latestVersion} ({updateInfo.latestCode})
              <ShieldCheck size={14} />
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleDownload}
            className={`flex-1 py-3 px-4 rounded-xl text-white font-medium shadow-sm transition flex items-center justify-center gap-2 ${theme.primary}`}
          >
            <Download size={18} />
            <span>{t('appUpdate.downloadUpdate') || 'Download update'}</span>
          </button>
          <button
            onClick={handleLater}
            className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 font-medium transition"
          >
            {t('appUpdate.later') || 'Later'}
          </button>
        </div>
      </div>
    </div>
  );
}
