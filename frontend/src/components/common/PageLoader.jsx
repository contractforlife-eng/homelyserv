// frontend/src/components/common/PageLoader.jsx
// Reusable loading component for consistent loading UI.
// Supports dark/light mode and matches the existing design system.
import React from 'react';

const PageLoader = ({ text = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">{text}</p>
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