import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import amazonShoppingImage from '../../assets/amazon-shopping.webp';

const AMAZON_WEB_URL = 'https://www.amazon.eg/?linkCode=ll2&tag=homelyserv-21&linkId=8bc6529d5a6bcee91711c27c4e4b44f7&ref_=as_li_ss_tl';
const AMAZON_NATIVE_URL = 'https://www.amazon.eg/';

/**
 * AmazonEgyptCard
 * Shared promotional card for Amazon Egypt.
 *
 * Web:
 * - Uses exact affiliate URL with tag=homelyserv-21.
 * - Opens in new tab with target="_blank" and rel="sponsored noopener noreferrer".
 * - Shows localized affiliate disclosure.
 *
 * Native Android (Capacitor):
 * - Uses plain https://www.amazon.eg/ without tracking parameters.
 * - Opens outside the app via Capacitor Browser / system intent.
 * - Omits the affiliate disclosure.
 */
const AmazonEgyptCard = ({ className = 'mb-6' }) => {
  const { t } = useTranslation();
  const isNative = Capacitor.isNativePlatform();

  const handleNativeClick = async (e) => {
    e.preventDefault();
    try {
      if (Browser && typeof Browser.open === 'function') {
        await Browser.open({ url: AMAZON_NATIVE_URL });
        return;
      }
    } catch (err) {
      console.warn('[AmazonCard] Capacitor Browser open failed, falling back:', err);
    }

    try {
      window.open(AMAZON_NATIVE_URL, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = AMAZON_NATIVE_URL;
    }
  };

  return (
    <section
      data-testid="amazon-egypt-card"
      className={`rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-amber-950/30 overflow-hidden shadow-sm ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 sm:p-5 gap-4">
        {/* Left / Start Content: Landscape Image + Text */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          <img
            src={amazonShoppingImage}
            alt={t('marketplace.amazonHeading')}
            className="w-full sm:w-[150px] h-[90px] rounded-xl object-cover border border-amber-200 dark:border-amber-900/50 flex-shrink-0 shadow-sm"
            loading="lazy"
            width="150"
            height="90"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {t('marketplace.amazonHeading')}
            </h2>
            {!isNative && (
              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {t('marketplace.amazonDisclosure')}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0 w-full sm:w-auto flex sm:block justify-start">
          {isNative ? (
            <button
              type="button"
              onClick={handleNativeClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-sm transition-colors shadow-sm"
              aria-label={t('marketplace.amazonButton')}
            >
              <span>{t('marketplace.amazonButton')}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </button>
          ) : (
            <a
              href={AMAZON_WEB_URL}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-semibold text-sm transition-colors shadow-sm"
              aria-label={t('marketplace.amazonButton')}
            >
              <span>{t('marketplace.amazonButton')}</span>
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
};

export default AmazonEgyptCard;
