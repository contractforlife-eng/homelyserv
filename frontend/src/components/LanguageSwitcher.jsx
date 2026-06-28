// frontend/src/components/LanguageSwitcher.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ar', name: 'Arabic', flag: '🇪🇬' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' }
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    document.documentElement.dir = langCode === 'ar' ? 'rtl' : 'ltr';
    setShowLanguages(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowLanguages(!showLanguages)}
        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:border-red-300 transition text-sm bg-white"
      >
        <Globe size={16} className="text-gray-500" />
        <span>{t('language')}</span>
      </button>

      {showLanguages && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-sm"
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-gray-700">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;