import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setShowMenu(false);
  };

  // Get current language code, default to 'en'
  const currentLang = i18n.language || 'en';

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          background: '#F5F5F5',
          color: '#1A1A1A',
          border: '1px solid #E0E0E0',
          padding: '6px 10px',
          borderRadius: '20px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🌐 {currentLang.toUpperCase()}
      </button>

      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '35px',
            right: '0',
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: '8px 0',
            zIndex: 1000,
            minWidth: '160px'
          }}
        >
          {languages.map(lang => (
            <div
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                color: '#1A1A1A',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.background = '#F5F5F5'}
              onMouseLeave={(e) => e.target.style.background = 'transparent'}
            >
              {lang.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}