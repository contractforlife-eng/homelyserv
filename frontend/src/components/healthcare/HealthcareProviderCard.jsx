// src/components/healthcare/HealthcareProviderCard.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stethoscope,
  Building2,
  Building,
  Pill,
  FlaskConical,
  Scan,
  MapPin,
  Phone,
  Mail,
  Globe,
  Navigation,
  CheckCircle2,
  Clock,
  Star,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Eye,
  HeartHandshake
} from 'lucide-react';
import {
  getLocalizedProviderType,
  getLocalizedService,
  getLocalizedSpecialty,
  getLocalizedCountry,
  getLocalizedRegion,
  getLocalizedCity,
  getLocalizedProviderName
} from '../../utils/healthcareLocalization';

const TYPE_CONFIG = {
  Doctor: {
    icon: Stethoscope,
    badgeBg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
  },
  doctor: {
    icon: Stethoscope,
    badgeBg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900',
    iconBg: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400'
  },
  Hospital: {
    icon: Building2,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
  },
  hospital: {
    icon: Building2,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
    iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
  },
  Clinic: {
    icon: Building,
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'
  },
  clinic: {
    icon: Building,
    badgeBg: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
    iconBg: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400'
  },
  Pharmacy: {
    icon: Pill,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
  },
  pharmacy: {
    icon: Pill,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
    iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
  },
  Laboratory: {
    icon: FlaskConical,
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400'
  },
  laboratory: {
    icon: FlaskConical,
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
    iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400'
  },
  'Diagnostic Center': {
    icon: Scan,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
  },
  diagnostic_center: {
    icon: Scan,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900',
    iconBg: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400'
  },
  care_home: {
    icon: HeartHandshake,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
  },
  'Care Home': {
    icon: HeartHandshake,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
    iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
  },
  optical: {
    icon: Eye,
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400'
  },
  Optical: {
    icon: Eye,
    badgeBg: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-900',
    iconBg: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400'
  },
  specialized_center: {
    icon: Sparkles,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
  },
  'Specialized Center': {
    icon: Sparkles,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
    iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'
  }
};

export default function HealthcareProviderCard({ provider }) {
  const { t, i18n } = useTranslation();
  const isArabic = i18n?.language === 'ar';

  const rawType = provider.providerType || 'clinic';
  const config = TYPE_CONFIG[rawType] || {
    icon: Building2,
    badgeBg: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    iconBg: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  };

  const IconComponent = config.icon;

  // Localized provider type safely using helper
  const translatedType = getLocalizedProviderType(rawType, t);

  // Localized provider name with instant fallback and seamless background update support
  const [displayName, setDisplayName] = useState(() =>
    getLocalizedProviderName(
      provider.providerName,
      i18n?.language,
      provider.providerNameArabic
    )
  );

  useEffect(() => {
    let isMounted = true;
    const resolved = getLocalizedProviderName(
      provider.providerName,
      i18n?.language,
      provider.providerNameArabic,
      (updatedTranslation) => {
        if (isMounted && updatedTranslation) {
          setDisplayName(updatedTranslation);
        }
      }
    );
    setDisplayName(resolved);
    return () => {
      isMounted = false;
    };
  }, [provider.providerName, provider.providerNameArabic, i18n?.language]);

  // Localized location components
  const locCountry = provider.country ? getLocalizedCountry(provider.country, i18n?.language) : '';
  const locRegion = provider.region ? getLocalizedRegion(provider.region, i18n?.language) : '';
  const locCity = provider.city ? getLocalizedCity(provider.city, i18n?.language) : '';
  const locArea = provider.area || '';

  const displayLocation = [locArea, locCity, locRegion, locCountry]
    .filter(Boolean)
    .join(', ');

  const localizedSpecialty = provider.specialty
    ? getLocalizedSpecialty(provider.specialty, i18n?.language)
    : '';

  const isVerified = provider.isVerified || provider.verificationStatus === 'verified';
  const hasEmergency = Boolean(provider.hasEmergency);
  const hasDental = Boolean(provider.hasDental);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700/80 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden group">
      {/* Top Banner / Card Header */}
      <div className="p-5 pb-4 border-b border-gray-100 dark:border-gray-700/60">
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 ${config.iconBg}`}>
              <IconComponent size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.badgeBg}`}
                title={t('healthcarePage.providerTypeLabel') || 'Provider Type'}
              >
                {translatedType}
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white whitespace-normal break-words leading-snug mt-1">
                {displayName}
              </h3>
            </div>
          </div>

          {isVerified && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 px-2 py-0.5 rounded-full flex-shrink-0"
              title={t('healthcarePage.verifiedBadge') || 'Verified'}
            >
              <CheckCircle2 size={13} className="text-teal-600 dark:text-teal-400" />
              <span>{t('healthcarePage.verifiedBadge') || 'Verified'}</span>
            </span>
          )}
        </div>

        {/* Feature Badges: Emergency / Dental */}
        {(hasEmergency || hasDental) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {hasEmergency && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2 py-0.5 rounded-full">
                <AlertCircle size={11} className="text-rose-600 dark:text-rose-400" />
                <span>{t('healthcarePage.emergency') || 'Emergency'}</span>
              </span>
            )}
            {hasDental && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 px-2 py-0.5 rounded-full">
                <Sparkles size={11} className="text-teal-600 dark:text-teal-400" />
                <span>{t('healthcarePage.dental') || 'Dental'}</span>
              </span>
            )}
          </div>
        )}

        {/* Specialty */}
        {localizedSpecialty && (
          <div className="text-sm font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-2">
            <span>{localizedSpecialty}</span>
          </div>
        )}

        {/* Rating and working hours if available */}
        {(provider.rating || provider.workingHours) && (
          <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-500 dark:text-gray-400">
            {provider.rating && (
              <div
                className="flex items-center gap-1 font-semibold text-gray-700 dark:text-gray-200"
                title={t('healthcarePage.ratingLabel') || 'Rating'}
              >
                <Star size={13} className="fill-amber-400 text-amber-400" />
                <span>{provider.rating}</span>
                {provider.reviewsCount && (
                  <span className="font-normal text-gray-400 dark:text-gray-500">
                    {t('healthcarePage.reviewsCountLabel', { count: provider.reviewsCount }) || `(${provider.reviewsCount})`}
                  </span>
                )}
              </div>
            )}
            {provider.workingHours && (
              <div
                className="flex items-center gap-1"
                title={t('healthcarePage.workingHours') || 'Working Hours'}
              >
                <Clock size={12} className="text-gray-400" />
                <span className="truncate">{provider.workingHours}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body: Location, Address & Services */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Location Area & City */}
          <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
            <MapPin size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{displayLocation}</p>
              {provider.address && (
                <p className="text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">{provider.address}</p>
              )}
            </div>
          </div>

          {/* Services Chips */}
          {provider.services && provider.services.length > 0 && (
            <div className="pt-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-1.5">
                {t('healthcarePage.keyServices') || 'Key Services'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {provider.services.map((svc, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-2 py-0.5 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-600/50"
                  >
                    {getLocalizedService(svc, t)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Info Items */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
          {provider.phone && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Phone size={13} />
                <span>{t('healthcarePage.phone') || 'Phone'}:</span>
              </span>
              <a
                href={`tel:${provider.phone}`}
                className="font-medium text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                dir="ltr"
              >
                {provider.phone}
              </a>
            </div>
          )}

          {provider.email && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Mail size={13} />
                <span>{t('healthcarePage.email') || 'Email'}:</span>
              </span>
              <a
                href={`mailto:${provider.email}`}
                className="font-medium text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-400 truncate max-w-[200px] transition-colors"
              >
                {provider.email}
              </a>
            </div>
          )}

          {provider.website && (
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                <Globe size={13} />
                <span>{t('healthcarePage.website') || 'Website'}:</span>
              </span>
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-teal-600 dark:text-teal-400 hover:underline truncate max-w-[180px]"
              >
                <span>{t('healthcarePage.visitSite') || 'Visit Site'}</span>
                <ExternalLink size={11} />
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons: Directions & Call */}
        <div className="pt-2 flex items-center gap-2">
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-semibold rounded-xl text-center transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Phone size={13} />
              <span>{t('healthcarePage.callProvider') || 'Call Provider'}</span>
            </a>
          )}

          {provider.googleMapsUrl && (
            <a
              href={provider.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5"
              title={t('healthcarePage.map') || 'Map'}
            >
              <Navigation size={13} className="text-teal-600 dark:text-teal-400" />
              <span>{t('healthcarePage.map') || 'Map'}</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
