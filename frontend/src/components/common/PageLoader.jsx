// frontend/src/components/common/PageLoader.jsx
// Reusable loading component for consistent loading UI.
// Supports dark/light mode and matches the existing design system.
import React from 'react';
import { useTranslation } from 'react-i18next';

const PageLoader = ({ text, fullScreen = false }) => {
  const { t } = useTranslation();
  const displayText = text || t('loading');

  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">{displayText}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-yellow-500/20">
      {content}
    </div>
  );
};

export default PageLoader;