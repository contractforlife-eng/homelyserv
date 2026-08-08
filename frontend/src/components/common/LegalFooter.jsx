// src/components/common/LegalFooter.jsx
// Shared legal/public footer used by auth pages, dashboard layouts and public pages.
import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const FOOTER_LINKS = {
  en: [
    { to: '/about', label: 'About' },
    { to: '/terms', label: 'Terms & Conditions' },
    { to: '/refund-policy', label: 'Refund Policy' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/help', label: 'Help' }
  ],
  ar: [
    { to: '/about', label: 'من نحن' },
    { to: '/terms', label: 'الشروط والأحكام' },
    { to: '/refund-policy', label: 'سياسة الاسترداد' },
    { to: '/privacy', label: 'سياسة الخصوصية' },
    { to: '/contact', label: 'اتصل بنا' },
    { to: '/help', label: 'المساعدة' }
  ]
};

const LegalFooter = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const links = FOOTER_LINKS[lang] || FOOTER_LINKS.en;

  return (
    <footer className={`w-full mt-auto ${className}`}>
      <div className="w-full max-w-5xl mx-auto px-4 py-5">
        <nav aria-label="Legal" className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="hover:text-red-600 dark:hover:text-red-400 transition-colors hover:underline underline-offset-2"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="mt-3 text-center text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} HomelyServ. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default LegalFooter;