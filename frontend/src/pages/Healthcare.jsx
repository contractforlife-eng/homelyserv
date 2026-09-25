// src/pages/Healthcare.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  Search,
  MapPin,
  Stethoscope,
  Filter,
  X,
  Building2,
  CheckCircle,
  Globe2,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import markDark from '../assets/branding/homelyserv-mark-dark.png';
import LanguageSwitcher from '../components/LanguageSwitcher';
import LegalFooter from '../components/common/LegalFooter';
import HealthcareProviderCard from '../components/healthcare/HealthcareProviderCard';
import {
  getHealthcareProviders,
  getHealthcareCountries,
  getHealthcareRegions,
  getHealthcareCities,
  getHealthcareSpecialties
} from '../services/healthcareService';
import {
  getLocalizedCountry,
  getLocalizedRegion,
  getLocalizedCity,
  getLocalizedSpecialty
} from '../utils/healthcareLocalization';

// Standard healthcare categories supported by HomelyServ Healthcare
export const HEALTHCARE_PROVIDER_TYPES = [
  { key: 'doctor', canonical: 'doctor' },
  { key: 'hospital', canonical: 'hospital' },
  { key: 'clinic', canonical: 'clinic' },
  { key: 'pharmacy', canonical: 'pharmacy' },
  { key: 'laboratory', canonical: 'laboratory' },
  { key: 'diagnosticCenter', canonical: 'diagnostic_center' },
  { key: 'careHome', canonical: 'care_home' },
  { key: 'optical', canonical: 'optical' },
  { key: 'specializedCenter', canonical: 'specialized_center' },
  { key: 'other', canonical: 'other' }
];

export default function Healthcare() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n?.dir ? i18n.dir() === 'rtl' : false;

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  // Structured Filter state
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Pagination & Data state
  const [providers, setProviders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic filter dropdown options
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [specialties, setSpecialties] = useState([]);

  // Load countries on initial mount
  useEffect(() => {
    let isMounted = true;
    getHealthcareCountries()
      .then((data) => {
        if (isMounted) setCountries(data || []);
      })
      .catch((err) => {
        console.error('Error fetching countries:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load regions when selectedCountry changes
  useEffect(() => {
    let isMounted = true;
    getHealthcareRegions(selectedCountry)
      .then((data) => {
        if (isMounted) setRegions(data || []);
      })
      .catch((err) => {
        console.error('Error fetching regions:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  // Load cities when country or region changes
  useEffect(() => {
    let isMounted = true;
    getHealthcareCities(selectedCountry, selectedRegion)
      .then((data) => {
        if (isMounted) setCities(data || []);
      })
      .catch((err) => {
        console.error('Error fetching cities:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedCountry, selectedRegion]);

  // Load specialties
  useEffect(() => {
    let isMounted = true;
    getHealthcareSpecialties(selectedType)
      .then((data) => {
        if (isMounted) setSpecialties(data || []);
      })
      .catch((err) => {
        console.error('Error fetching specialties:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedType]);

  // Fetch real providers from backend
  const fetchProviders = useCallback(async (targetPage = 1) => {
    setIsLoading(true);
    try {
      const data = await getHealthcareProviders({
        page: targetPage,
        limit: 12,
        search: searchTerm,
        location: locationSearch,
        country: selectedCountry,
        region: selectedRegion,
        city: selectedCity,
        providerType: selectedType,
        specialty: selectedSpecialty
      });

      if (data && data.success) {
        setProviders(data.providers || []);
        setPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        setProviders([]);
        setPage(1);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error('Error loading healthcare providers:', err);
      setProviders([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, locationSearch, selectedCountry, selectedRegion, selectedCity, selectedType, selectedSpecialty]);

  // Debounced search & filter reload (reset to page 1)
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProviders(1);
    }, 300);

    return () => clearTimeout(handler);
  }, [fetchProviders]);

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      window.scrollTo({ top: 380, behavior: 'smooth' });
      fetchProviders(newPage);
    }
  };

  // Geographic filter handlers
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setSelectedRegion('All');
    setSelectedCity('All');
  };

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setSelectedCity('All');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setLocationSearch('');
    setSelectedCountry('All');
    setSelectedRegion('All');
    setSelectedCity('All');
    setSelectedType('All Types');
    setSelectedSpecialty('All Specialties');
  };

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
    locationSearch.trim() ||
    selectedCountry !== 'All' ||
    selectedRegion !== 'All' ||
    selectedCity !== 'All' ||
    selectedType !== 'All Types' ||
    selectedSpecialty !== 'All Specialties'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* ========================================================= */}
      {/* 1. PUBLIC HEADER / NAVIGATION */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-slate-200/80 dark:border-gray-700/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group focus:outline-none">
              <img
                src={markDark}
                alt="HomelyServ"
                className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105"
              />
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
                Homely<span className="text-red-600">Serv</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Link to="/#services" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">
                {t('home.nav.services')}
              </Link>
              <Link to="/healthcare" className="text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5 py-1">
                <HeartPulse size={16} />
                <span>{t('healthcarePage.nav')}</span>
              </Link>
              <Link to="/#how-it-works" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">
                {t('home.nav.howItWorks')}
              </Link>
              <Link to="/about" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">
                {t('aboutPage.title')}
              </Link>
              <Link to="/contact" className="hover:text-red-600 dark:hover:text-red-400 transition-colors py-1">
                {t('contactPage.title')}
              </Link>
            </nav>

            {/* Language & Auth Actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <Link
                to="/login"
                className="hidden sm:inline-flex text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-red-600 px-3 py-2 transition"
              >
                {t('home.nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 active:scale-95 transition shadow-sm hover:shadow"
              >
                {t('home.nav.register')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO AREA */}
      {/* ========================================================= */}
      <section className="relative bg-gradient-to-b from-red-600 via-red-600 to-red-700 text-white py-12 md:py-16 overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-10 w-96 h-96 rounded-full bg-white blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full bg-teal-400 blur-2xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold uppercase tracking-wider mb-4 border border-white/20">
              <HeartPulse size={14} className="text-teal-300" />
              <span>{t('healthcarePage.badge')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-4">
              {t('healthcarePage.heroTitle')}
            </h1>
            <p className="text-base sm:text-lg text-red-100 leading-relaxed max-w-2xl">
              {t('healthcarePage.heroDescription')}
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="mt-8 flex flex-wrap gap-4 text-xs font-medium text-red-100">
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <CheckCircle size={14} className="text-teal-300" />
              <span>{t('healthcarePage.statsVerified')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <Globe2 size={14} className="text-teal-300" />
              <span>{t('healthcarePage.statsReach')}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10">
              <Building2 size={14} className="text-teal-300" />
              <span>{t('healthcarePage.statsActions')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. MAIN CONTENT: SEARCH, FILTERS & RESULTS */}
      {/* ========================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Search Bar Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mb-8 -mt-10 relative z-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            {/* 1. Name or Specialty Search */}
            <div className="md:col-span-5 relative">
              <Search size={18} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('healthcarePage.searchPlaceholder')}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* 2. City or Location Search */}
            <div className="md:col-span-5 relative">
              <MapPin size={18} className="absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder={t('healthcarePage.locationPlaceholder')}
                className="w-full pl-10 rtl:pl-4 rtl:pr-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white dark:focus:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            {/* 3. Mobile Filter Toggle / Clear */}
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                className={`flex-1 md:w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition border ${
                  showFiltersMobile || hasActiveFilters
                    ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-100'
                }`}
              >
                <Filter size={16} />
                <span>{t('healthcarePage.filters')}</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-red-600"></span>
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="p-2.5 text-gray-400 hover:text-red-600 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  title={t('healthcarePage.clearFilters')}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Detailed Filter Row */}
          <div className={`mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/60 ${showFiltersMobile ? 'block' : 'hidden md:block'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Filter: Country */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {t('healthcarePage.country')}
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                >
                  <option value="All">{t('healthcarePage.allCountries')}</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {getLocalizedCountry(c, i18n?.language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: Region / State / Governorate */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {t('healthcarePage.region')}
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                >
                  <option value="All">{t('healthcarePage.allRegions')}</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {getLocalizedRegion(r, i18n?.language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: City */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {t('healthcarePage.city')}
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                >
                  <option value="All">{t('healthcarePage.allCities')}</option>
                  {cities.map((ct) => (
                    <option key={ct} value={ct}>
                      {getLocalizedCity(ct, i18n?.language)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: Provider Type */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {t('healthcarePage.providerType')}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                >
                  <option value="All Types">{t('healthcarePage.allTypes')}</option>
                  {HEALTHCARE_PROVIDER_TYPES.map((typeObj) => (
                    <option key={typeObj.key} value={typeObj.canonical}>
                      {t(`healthcarePage.types.${typeObj.key}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter: Specialty */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  {t('healthcarePage.specialty')}
                </label>
                <select
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white"
                >
                  <option value="All Specialties">{t('healthcarePage.allSpecialties')}</option>
                  {specialties.map((s) => (
                    <option key={s} value={s}>
                      {getLocalizedSpecialty(s, i18n?.language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Header / Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{t('healthcarePage.resultsTitle')}</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                {t('healthcarePage.resultsCount', { count: totalCount })}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('healthcarePage.resultsSubtitle')}
            </p>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 self-start sm:self-auto flex items-center gap-1"
            >
              <X size={14} />
              <span>{t('healthcarePage.resetFilters')}</span>
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-12 text-red-600 dark:text-red-400 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm font-medium">{t('healthcarePage.loading') || 'Loading providers...'}</span>
          </div>
        )}

        {/* Results Grid or Empty State */}
        {!isLoading && providers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {providers.map((provider) => (
                <HealthcareProviderCard
                  key={provider.providerId || provider._id}
                  provider={provider}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2 select-none">
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                >
                  {isRTL ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
                  <span>{t('healthcarePage.previousPage') || 'Previous'}</span>
                </button>

                <div className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  {t('healthcarePage.pageInfo', { page, totalPages }) || `Page ${page} of ${totalPages}`}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
                >
                  <span>{t('healthcarePage.nextPage') || 'Next'}</span>
                  {isRTL ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                </button>
              </div>
            )}
          </>
        ) : !isLoading && hasActiveFilters ? (
          /* Empty State when filters yield no matches */
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <Stethoscope size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('healthcarePage.noFilterResultsTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {t('healthcarePage.noFilterResultsDesc')}
            </p>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
            >
              {t('healthcarePage.clearFilters')}
            </button>
          </div>
        ) : !isLoading ? (
          /* Default Empty State when no providers are in DB */
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center max-w-xl mx-auto my-8 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
              <Stethoscope size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {t('healthcarePage.emptyTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">
              {t('healthcarePage.emptyDescription')}
            </p>
          </div>
        ) : null}
      </main>

      {/* ========================================================= */}
      {/* 4. FOOTER */}
      {/* ========================================================= */}
      <LegalFooter className="mt-auto" />
    </div>
  );
}
