import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogIn, Settings, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import LegalFooter from '../components/common/LegalFooter';

const settingsPathForRole = (role) => {
  const normalizedRole = role?.toUpperCase();
  if (normalizedRole === 'EMPLOYER') return '/employer-settings';
  if (normalizedRole === 'WORKER') return '/worker-settings';
  return null;
};

const DeleteAccount = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const settingsPath = settingsPathForRole(user?.role);

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={18} />
            {t('deleteAccountPage.back')}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-5">
            <ShieldCheck className="text-red-600" size={28} aria-hidden="true" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">
              {t('deleteAccountPage.title')}
            </h1>
          </div>

          <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {t('deleteAccountPage.intro')}
          </p>

          <section className="space-y-3 text-gray-600 dark:text-gray-300 leading-relaxed">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {t('deleteAccountPage.howItWorksTitle')}
            </h2>
            <p>{t('deleteAccountPage.identity')}</p>
            <p>{t('deleteAccountPage.process')}</p>
          </section>

          <section className="mt-7 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 p-4 text-gray-700 dark:text-gray-300 leading-relaxed">
            <h2 className="font-semibold text-gray-800 dark:text-white mb-2">
              {t('deleteAccountPage.retentionTitle')}
            </h2>
            <p>{t('deleteAccountPage.retention')}</p>
          </section>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {isAuthenticated && settingsPath ? (
              <Link
                to={settingsPath}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <Settings size={18} />
                {t('deleteAccountPage.settingsCta')}
              </Link>
            ) : !isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                <LogIn size={18} />
                {t('deleteAccountPage.loginCta')}
              </Link>
            ) : (
              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700 transition-colors"
              >
                {t('deleteAccountPage.contactCta')}
              </Link>
            )}
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link to="/privacy" className="text-red-600 hover:underline">
              {t('deleteAccountPage.privacyLink')}
            </Link>
            <Link to="/terms" className="text-red-600 hover:underline">
              {t('deleteAccountPage.termsLink')}
            </Link>
          </div>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
};

export default DeleteAccount;
