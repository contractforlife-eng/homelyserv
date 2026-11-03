import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { useTranslation } from 'react-i18next';
import { Info } from 'lucide-react';
import { fetchAppVersionInfo } from '../../utils/appVersionInfo.js';

/**
 * Safely fetches installed app info on native platforms via @capacitor/app.
 * On web or in case of error, returns null gracefully without misleading info.
 */
export const getInstalledAppInfo = async () => {
  return fetchAppVersionInfo({
    isNativePlatform: () => Capacitor.isNativePlatform(),
    getInfo: () => App.getInfo(),
  });
};

/**
 * AppVersionBadge component displayed near the bottom of Settings.
 * Displays version and build number dynamically if running inside native Android/iOS app.
 * If running on web, renders nothing.
 */
const AppVersionBadge = ({ className = '' }) => {
  const { t } = useTranslation();
  const [appInfo, setAppInfo] = useState(null);

  useEffect(() => {
    let active = true;
    getInstalledAppInfo().then((info) => {
      if (active && info) {
        setAppInfo(info);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!appInfo) {
    return null;
  }

  const { version, build } = appInfo;

  return (
    <div
      data-testid="app-version-badge"
      className={`flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/60 text-sm ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Info size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
        <div className="min-w-0">
          <p className="font-medium text-gray-700 dark:text-gray-200 truncate">
            {t('appVersion.title') || 'App Version'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('appVersion.environmentNative') || 'Installed mobile app'}
          </p>
        </div>
      </div>
      <div className="text-end shrink-0 ms-3" dir="ltr">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-200/70 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
          {t('appVersion.versionLabel') || 'Version'} {version} {build ? `(${t('appVersion.buildLabel') || 'Build'} ${build})` : ''}
        </span>
      </div>
    </div>
  );
};

export default AppVersionBadge;
