import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: '🇬🇧 English' },
  { code: 'ar', label: '🇸🇦 العربية' },
  { code: 'ru', label: '🇷🇺 Русский' },
  { code: 'fr', label: '🇫🇷 Français' },
  { code: 'de', label: '🇩🇪 Deutsch' },
  { code: 'tr', label: '🇹🇷 Türkçe' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setShowMenu(false);
  };

  const currentLang = i18n.language || 'en';
  const currentFlag = languages.find(l => l.code === currentLang)?.label.split(' ')[0] || '🌐';

  return (
    <div className="lang-switcher">
      <button
        className="lang-btn"
        onClick={() => setShowMenu(!showMenu)}
        aria-label="Change language"
      >
        <span className="lang-flag">{currentFlag}</span>
        <span className="lang-code">{currentLang.toUpperCase()}</span>
        <span className="lang-arrow">▾</span>
      </button>

      {showMenu && (
        <div className="lang-dropdown">
          {languages.map(lang => (
            <div
              key={lang.code}
              className={`lang-item ${lang.code === currentLang ? 'active' : ''}`}
              onClick={() => changeLanguage(lang.code)}
            >
              <span className="lang-item-flag">{lang.label.split(' ')[0]}</span>
              <span className="lang-item-label">{lang.label.split(' ').slice(1).join(' ')}</span>
              {lang.code === currentLang && <span className="lang-item-check">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}