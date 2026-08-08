// src/components/common/LegalDocument.jsx
// Reusable public document shell for legal/policy pages (Terms, Refund Policy, Privacy Policy).
// Supports English + Arabic with RTL/LTR, a back button, a language toggle and the shared footer.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Globe, Loader2 } from 'lucide-react';
import { applyDocumentDirection, LANGUAGE_STORAGE_KEY, changeLanguageGlobal } from '../../i18n';
import LegalFooter from './LegalFooter';

const resolveLang = (code) => (code && code.toLowerCase().startsWith('ar')) ? 'ar' : 'en';

const Block = ({ block }) => {
  switch (block.type) {
    case 'h3':
      return (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-6 mb-2">
          {block.text}
        </h3>
      );
    case 'ul':
      return (
        <ul className="list-disc ps-5 space-y-1.5 mb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol className="list-decimal ps-5 space-y-1.5 mb-4 text-gray-600 dark:text-gray-300 leading-relaxed">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );
    case 'callout':
      return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl p-4 mb-4">
          {block.title && (
            <p className="font-semibold text-gray-800 dark:text-white mb-2">{block.title}</p>
          )}
          {block.items ? (
            <ul className="list-disc ps-5 space-y-1.5 text-gray-700 dark:text-gray-300 leading-relaxed">
              {block.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          ) : block.text ? (
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{block.text}</p>
          ) : null}
        </div>
      );
    case 'def':
      return (
        <div className="space-y-3 mb-4">
          {block.rows.map((row, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-semibold text-gray-800 dark:text-white">{row.label}</h4>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{row.desc}</p>
            </div>
          ))}
        </div>
      );
    case 'p':
    default:
      return (
        <p className="mb-4 text-gray-600 dark:text-gray-300 leading-relaxed">{block.text}</p>
      );
  }
};

const LegalDocument = ({ content }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored || i18n.language || 'en';
  });

  const lang = resolveLang(language);
  const data = content[lang] || content.en;
  const isRTL = lang === 'ar';

  useEffect(() => {
    const onLanguageChanged = (lng) => {
      setLanguage(lng || 'en');
      applyDocumentDirection(lng || 'en');
    };
    i18n.on('languageChanged', onLanguageChanged);
    return () => i18n.off('languageChanged', onLanguageChanged);
  }, [i18n]);

  useEffect(() => {
    applyDocumentDirection(lang);
  }, [lang]);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/login');
    }
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors text-sm font-medium shrink-0"
            >
              <BackIcon size={18} />
              {data.back}
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white truncate">
              {data.title}
            </h1>
          </div>
          <button
            onClick={() => changeLanguageGlobal(lang === 'ar' ? 'en' : 'ar')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-red-300 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0"
            aria-label="Toggle language"
          >
            <Globe size={15} className="text-red-600" />
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 sm:p-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{data.lastUpdated}</p>
          {data.subtitle && (
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{data.subtitle}</p>
          )}
          {data.sections.map((section) => (
            <section key={section.id} aria-labelledby={`section-${section.id}`} className="mb-6">
              <h2
                id={`section-${section.id}`}
                className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-3"
              >
                {section.heading}
              </h2>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} />
              ))}
            </section>
          ))}

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40 rounded-xl p-4 mt-4">
            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{data.notice}</p>
          </div>
        </article>
      </main>

      <LegalFooter />
    </div>
  );
};

export default LegalDocument;