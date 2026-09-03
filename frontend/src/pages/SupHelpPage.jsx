// frontend/src/pages/SupHelpPage.jsx
// ============================================================
// Minimal, SAFE role-landing page for the SUPPORT_HELPER ("Sup-Help")
// support-helper persona. Phase 1 only: it must NOT expose any Support
// operational APIs, private-chat, payments, or admin tooling. The real
// Sup-Help workspace is intentionally left for Phase 2.
//
// Auth gating is handled by <ProtectedRoute requiredRole="SUPPORT_HELPER">
// in App.jsx; this component only renders static identification content.
// ============================================================
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Headphones, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

const SupHelpPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <Headphones size={28} className="text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
          {t('sharedUserDisplay.roles.supportHelper')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
          {t('supHelpPage.message')}
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm font-medium border border-red-200 dark:border-red-700">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          {t('supHelpPage.signedInAs', { role: t('sharedUserDisplay.roles.supportHelper') })}
          </div>
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors border border-red-200 dark:border-red-700"
          >
            <LogOut size={18} />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupHelpPage;
