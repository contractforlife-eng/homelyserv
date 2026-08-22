// src/components/common/LegalFooter.jsx
// Shared legal/public footer used by auth pages, dashboard layouts and public pages.
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FOOTER_LINKS = {
  en: [
    { to: '/about', key: 'legalFooter.about' },
    { to: '/terms', key: 'terms' },
    { to: '/refund-policy', key: 'refundPolicy' },
    { to: '/privacy', key: 'legalLinks.privacyPolicy' },
    { to: '/contact', key: 'contact' },
    { to: '/help', key: 'help' }
  ],
  ar: [
    { to: '/about', key: 'legalFooter.about' },
    { to: '/terms', key: 'terms' },
    { to: '/refund-policy', key: 'refundPolicy' },
    { to: '/privacy', key: 'legalLinks.privacyPolicy' },
    { to: '/contact', key: 'contact' },
    { to: '/help', key: 'help' }
  ],
  fr: [
    { to: '/about', key: 'legalFooter.about' },
    { to: '/terms', key: 'terms' },
    { to: '/refund-policy', key: 'refundPolicy' },
    { to: '/privacy', key: 'legalLinks.privacyPolicy' },
    { to: '/contact', key: 'contact' },
    { to: '/help', key: 'help' }
  ],
  ru: [
    { to: '/about', key: 'legalFooter.about' },
    { to: '/terms', key: 'terms' },
    { to: '/refund-policy', key: 'refundPolicy' },
    { to: '/privacy', key: 'legalLinks.privacyPolicy' },
    { to: '/contact', key: 'contact' },
    { to: '/help', key: 'help' }
  ],
  tr: [
    { to: '/about', key: 'legalFooter.about' },
    { to: '/terms', key: 'terms' },
    { to: '/refund-policy', key: 'refundPolicy' },
    { to: '/privacy', key: 'legalLinks.privacyPolicy' },
    { to: '/contact', key: 'contact' },
    { to: '/help', key: 'help' }
  ],
  de: [
    { to: '/about', key: 'legalFooter.about' },
    { to: '/terms', key: 'terms' },
    { to: '/refund-policy', key: 'refundPolicy' },
    { to: '/privacy', key: 'legalLinks.privacyPolicy' },
    { to: '/contact', key: 'contact' },
    { to: '/help', key: 'help' }
  ]
};

const LegalFooter = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const lang = (i18n.language || 'en').toLowerCase();
  const links = FOOTER_LINKS[lang] || FOOTER_LINKS.en;
  const linksWithDeletion = [...links, { to: '/delete-account', key: 'legalLinks.deleteAccount' }];

  return (
    <footer className={`w-full mt-auto ${className}`}>
      <div className="w-full max-w-5xl mx-auto px-4 py-5">
        <nav aria-label={t('legalFooter.navigation')} className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {linksWithDeletion.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors hover:underline underline-offset-2"
                >
                  {t(link.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-3 text-center text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
          {t('legalFooter.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
};

export default LegalFooter;
