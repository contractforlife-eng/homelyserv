// src/pages/SearchWorkers.jsx - SEARCH WORKERS (TEACHER + DOCTOR)
// ============================================================
// Read-only worker directory for Teacher and Doctor accounts.
//
// REUSES THE EXISTING SEARCH SYSTEM
//   - Results come from the existing employer worker-search endpoint
//     (GET /api/employers/search) through the existing
//     employerService.searchWorkers() client. No new backend route,
//     no new search service, no duplicate query logic.
//   - The backend already restricts non-EMPLOYER callers to WORKER
//     accounts only, so Employers, Teachers, Doctors, Students and
//     staff accounts can never appear here.
//
// HIRING (TEACHER + DOCTOR)
//   Each WORKER card now exposes the same Hire action an Employer gets. It
//   reuses the EXISTING hiring endpoint (POST /api/hires via
//   hireService.sendOffer), so the Offer -> Worker accepts -> Hire lifecycle,
//   the availability check, offer validation and the notification/push
//   behaviour are exactly the Employer's. No new hire model, controller or
//   endpoint. Payments/commission are NOT added here: they remain part of the
//   existing Worker-accept step, untouched.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { JOB_OPTIONS } from '../constants/jobOptions';
import { formatWorkerRate } from '../utils/workerRateDisplay';
import employerService from '../services/employerService';
import hireService from '../services/hireService';
import { SUPPORTED_CURRENCIES, getAccountCurrency } from '../utils/currencyPresentation';
import {
  Search as SearchIcon,
  Briefcase,
  MapPin,
  Star,
  Users,
  UserPlus,
  X,
  SlidersHorizontal,
} from 'lucide-react';

const ALLOWED_ROLES = ['TEACHER', 'DOCTOR'];
const OFFER_CURRENCIES = SUPPORTED_CURRENCIES;
const MAX_SKILLS_SHOWN = 4;

const createInitialFilters = () => ({
  query: '',
  category: '',
  location: '',
  minRating: 0,
  minExperience: 0,
  language: 'all',
});

const isBase64Image = (value) =>
  typeof value === 'string' && value.startsWith('data:image/');

const extractExperienceYears = (worker) => {
  const match = String(worker?.experience ?? '').match(/^\d+(?:\.\d+)?/);
  return match ? match[0] : '0';
};

const SearchWorkers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [filters, setFilters] = useState(createInitialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [workers, setWorkers] = useState([]);

  const userRole = String(authUser?.role || '').toUpperCase();
  const isRoleAllowed = ALLOWED_ROLES.includes(userRole);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login', { replace: true });
      return;
    }

    if (!ALLOWED_ROLES.includes(String(authUser.role || '').toUpperCase())) {
      navigate('/login', { replace: true });
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  const buildRequestFilters = useCallback((current) => ({
    ...(current.query.trim() ? { query: current.query.trim() } : {}),
    ...(current.category ? { category: current.category } : {}),
    ...(current.location.trim() ? { location: current.location.trim() } : {}),
    ...(current.minRating > 0 ? { minRating: current.minRating } : {}),
    ...(current.minExperience > 0 ? { minExperience: current.minExperience } : {}),
    ...(current.language !== 'all' ? { language: current.language } : {}),
  }), []);

  const runSearch = useCallback(async (currentFilters) => {
    setLoading(true);
    setError('');

    try {
      const data = await employerService.searchWorkers(buildRequestFilters(currentFilters));

      if (!data?.success) {
        setWorkers([]);
        if (data?.message) console.warn('Search workers rejected:', data.message);
        setError(t('searchWorkersPage.loadFailed'));
        return;
      }

      // Defensive role filter: the endpoint already scopes non-EMPLOYER
      // callers to WORKER accounts, and this keeps that guarantee local so a
      // future backend change can never leak another account type here.
      const safeWorkers = (data.workers || []).filter(
        (worker) => String(worker?.role || 'WORKER').toUpperCase() === 'WORKER'
      );

      setWorkers(safeWorkers.map((worker) => ({
        ...worker,
        id: worker.id || worker._id,
        profileImage: isBase64Image(worker.profileImage) ? '' : (worker.profileImage || worker.image || ''),
      })));
    } catch (requestError) {
      setWorkers([]);
      if (requestError?.response?.data?.message) {
        console.warn('Search workers failed:', requestError.response.data.message);
      }
      setError(t('searchWorkersPage.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [buildRequestFilters, t]);

  // Initial discovery load (no filters, no quota implications).
  useEffect(() => {
    if (!isRoleAllowed) return;
    setHasSearched(true);
    runSearch(createInitialFilters());
  }, [isRoleAllowed, runSearch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setHasSearched(true);
    runSearch(filters);
  };

  const handleClear = () => {
    const cleared = createInitialFilters();
    setFilters(cleared);
    setHasSearched(true);
    runSearch(cleared);
  };

  const updateFilter = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
  };


  const getServiceLabel = (value) => {
    const option = JOB_OPTIONS.find((job) => job.value === value);
    if (!option) return t('searchWorkersPage.serviceNotSpecified');
    return t(`employerSearch.jobs.${option.value}`, { defaultValue: option.label });
  };

  const getWorkerLocation = (worker) =>
    worker?.location?.trim() || worker?.countryName?.trim() || t('searchWorkersPage.notSpecified');

  const getRating = (worker) => {
    const rating = Number(worker?.ratingAvg ?? worker?.rating ?? 0);
    return Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null;
  };

  // ============================================================
  // HIRE — reuses the EXISTING Employer hiring lifecycle end to end.
  // hireService.sendOffer -> POST /api/hires -> hireController.sendOffer
  // -> offerService.createOffer (status 'pending'). The Worker accepts via the
  // unchanged respondToOffer endpoint, which is what creates the Hire.
  // ============================================================
  const [hireTarget, setHireTarget] = useState(null);
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hireError, setHireError] = useState('');
  const [hireSent, setHireSent] = useState(false);
  const [hireForm, setHireForm] = useState({
    jobTitle: '',
    agreedSalary: '',
    compensationCurrency: 'EGP',
    message: '',
  });

  const defaultHireCurrency = () => {
    const resolved = getAccountCurrency(authUser);
    return OFFER_CURRENCIES.includes(resolved) ? resolved : OFFER_CURRENCIES[0];
  };

  const openHire = (worker) => {
    setHireTarget(worker);
    setHireSent(false);
    setHireError('');
    setHireForm({
      jobTitle: getServiceLabel(worker.desiredJob),
      agreedSalary: '',
      compensationCurrency: defaultHireCurrency(),
      message: '',
    });
  };

  const closeHire = () => {
    if (hireSubmitting) return;
    setHireTarget(null);
    setHireError('');
    setHireSent(false);
  };

  const submitHire = async (event) => {
    event.preventDefault();
    if (!hireTarget) return;

    const jobTitle = hireForm.jobTitle.trim();
    const agreedSalary = Number(hireForm.agreedSalary);

    if (!jobTitle) {
      setHireError(t('searchWorkersPage.hireJobTitleRequired'));
      return;
    }
    if (!Number.isFinite(agreedSalary) || agreedSalary <= 0) {
      setHireError(t('searchWorkersPage.hireSalaryRequired'));
      return;
    }

    setHireSubmitting(true);
    setHireError('');
    try {
      await hireService.sendOffer({
        workerId: hireTarget.id || hireTarget._id,
        jobTitle,
        agreedSalary: String(agreedSalary),
        compensationCurrency: hireForm.compensationCurrency,
        message: hireForm.message.trim() || undefined,
        workerName: hireTarget.fullName,
        employerName: authUser?.fullName,
        employerEmail: authUser?.email,
      });
      setHireSent(true);
    } catch (requestError) {
      setHireError(
        requestError?.response?.data?.message || t('searchWorkersPage.hireFailed'),
      );
    } finally {
      setHireSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('searchWorkersPage.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isUserPremium(authUser?.id || authUser?.email)}
      />

      <div className="px-4 md:px-6 pb-10 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('searchWorkersPage.title')}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('searchWorkersPage.subtitle')}
          </p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-4"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-3">
              <label
                htmlFor="search-workers-query"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('searchWorkersPage.searchLabel')}
              </label>
              <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <SearchIcon size={18} className="text-gray-400 shrink-0" />
                <input
                  id="search-workers-query"
                  type="text"
                  value={filters.query}
                  onChange={(event) => updateFilter('query', event.target.value)}
                  placeholder={t('searchWorkersPage.searchPlaceholder')}
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="search-workers-category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('searchWorkersPage.serviceLabel')}
              </label>
              <select
                id="search-workers-category"
                value={filters.category}
                onChange={(event) => updateFilter('category', event.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-[#1a1a2e] text-sm text-gray-900 dark:text-white"
              >
                <option value="">{t('searchWorkersPage.allServices')}</option>
                {JOB_OPTIONS.map((job) => (
                  <option key={job.value} value={job.value}>
                    {t(`employerSearch.jobs.${job.value}`, { defaultValue: job.label })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="search-workers-location"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {t('searchWorkersPage.locationLabel')}
              </label>
              <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                <input
                  id="search-workers-location"
                  type="text"
                  value={filters.location}
                  onChange={(event) => updateFilter('location', event.target.value)}
                  placeholder={t('searchWorkersPage.locationPlaceholder')}
                  className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2"
              >
                <SearchIcon size={18} />
                {loading ? t('searchWorkersPage.searching') : t('searchWorkersPage.searchButton')}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-teal-600"
            >
              <SlidersHorizontal size={16} />
              {showFilters ? t('searchWorkersPage.hideFilters') : t('searchWorkersPage.showFilters')}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-500"
            >
              <X size={16} />
              {t('searchWorkersPage.clearFilters')}
            </button>
          </div>

          {showFilters && (
            <div className="grid gap-3 md:grid-cols-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div>
                <label
                  htmlFor="search-workers-rating"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('searchWorkersPage.minRating')}
                </label>
                <select
                  id="search-workers-rating"
                  value={filters.minRating}
                  onChange={(event) => updateFilter('minRating', Number(event.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-[#1a1a2e] text-sm text-gray-900 dark:text-white"
                >
                  <option value={0}>{t('searchWorkersPage.anyRating')}</option>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {t('searchWorkersPage.ratingPlus', { rating: value })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="search-workers-experience"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('searchWorkersPage.minExperience')}
                </label>
                <select
                  id="search-workers-experience"
                  value={filters.minExperience}
                  onChange={(event) => updateFilter('minExperience', Number(event.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-[#1a1a2e] text-sm text-gray-900 dark:text-white"
                >
                  <option value={0}>{t('searchWorkersPage.anyExperience')}</option>
                  {[1, 3, 5, 10].map((value) => (
                    <option key={value} value={value}>
                      {t('searchWorkersPage.yearsPlus', { count: value })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="search-workers-language"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {t('searchWorkersPage.languageLabel')}
                </label>
                <select
                  id="search-workers-language"
                  value={filters.language}
                  onChange={(event) => updateFilter('language', event.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-[#1a1a2e] text-sm text-gray-900 dark:text-white"
                >
                  <option value="all">{t('searchWorkersPage.allLanguages')}</option>
                  <option value="arabic">{t('employerSearch.languages.arabic')}</option>
                  <option value="english">{t('employerSearch.languages.english')}</option>
                  <option value="french">{t('employerSearch.languages.french')}</option>
                  <option value="turkish">{t('employerSearch.languages.turkish')}</option>
                </select>
              </div>
            </div>
          )}
        </form>

        {error ? (
          <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {!loading && !error && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Users size={16} />
            <span>{t('searchWorkersPage.workersFound', { count: workers.length })}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
          </div>
        ) : null}

        {!loading && !error && hasSearched && workers.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('searchWorkersPage.noResultsTitle')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('searchWorkersPage.noResultsHint')}
            </p>
          </div>
        ) : null}

        {!loading && workers.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workers.map((worker) => {
              const rating = getRating(worker);
              const skills = Array.isArray(worker.skills) ? worker.skills : [];

              return (
                <article
                  key={worker.id}
                  className="bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                      {worker.profileImage ? (
                        <img
                          src={worker.profileImage}
                          alt={worker.fullName || t('searchWorkersPage.worker')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-gray-900 dark:text-white truncate">
                        {worker.fullName || t('searchWorkersPage.worker')}
                      </h2>
                      <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Briefcase size={14} />
                        <span className="truncate">{getServiceLabel(worker.desiredJob)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <MapPin size={14} />
                    <span className="truncate">{getWorkerLocation(worker)}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      {rating ?? t('searchWorkersPage.noRating')}
                    </span>
                    <span>
                      {t('searchWorkersPage.experienceYears', {
                        count: extractExperienceYears(worker),
                      })}
                    </span>
                    <span>{formatWorkerRate(worker, t, 'searchWorkersPage.rateNotSpecified')}</span>
                  </div>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {skills.slice(0, MAX_SKILLS_SHOWN).map((skill, index) => (
                        <span
                          key={`${skill}-${index}`}
                          className="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > MAX_SKILLS_SHOWN && (
                        <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                          {t('searchWorkersPage.moreSkills', { count: skills.length - MAX_SKILLS_SHOWN })}
                        </span>
                      )}
                    </div>
                  )}

                  {worker.activelyLooking ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 dark:bg-green-900/30 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                      {t('searchWorkersPage.activelyLooking')}
                    </span>
                  ) : null}

                  {/* Hire: the same action an Employer gets, hitting the same endpoint. */}
                  <div className="pt-1">
                    <button
                      onClick={() => openHire(worker)}
                      className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={14} />
                      {t('employerSearch.hireNow')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {hireTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {t('searchWorkersPage.hireTitle')}
              </h3>
              <button
                type="button"
                onClick={closeHire}
                aria-label={t('searchWorkersPage.hireClose')}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={submitHire} className="px-5 py-4 space-y-3">
              {hireSent ? (
                <p className="rounded-xl bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-300">
                  {t('searchWorkersPage.hireSuccess')}
                </p>
              ) : (
                <>
                  <div>
                    <label htmlFor="hire-job-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('searchWorkersPage.hireJobTitle')}
                    </label>
                    <input
                      id="hire-job-title"
                      type="text"
                      value={hireForm.jobTitle}
                      onChange={(e) => setHireForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="hire-salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('searchWorkersPage.hireSalary')}
                      </label>
                      <input
                        id="hire-salary"
                        type="number"
                        min="0"
                        step="0.01"
                        value={hireForm.agreedSalary}
                        onChange={(e) => setHireForm((prev) => ({ ...prev, agreedSalary: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="hire-currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('searchWorkersPage.hireCurrency')}
                      </label>
                      <select
                        id="hire-currency"
                        value={hireForm.compensationCurrency}
                        onChange={(e) => setHireForm((prev) => ({ ...prev, compensationCurrency: e.target.value }))}
                        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                      >
                        {OFFER_CURRENCIES.map((code) => (
                          <option key={code} value={code}>{code}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="hire-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('searchWorkersPage.hireMessage')}
                    </label>
                    <textarea
                      id="hire-message"
                      rows={3}
                      value={hireForm.message}
                      onChange={(e) => setHireForm((prev) => ({ ...prev, message: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                    />
                  </div>

                  {hireError ? (
                    <p className="rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                      {hireError}
                    </p>
                  ) : null}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={closeHire}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      {t('searchWorkersPage.hireCancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={hireSubmitting}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-semibold"
                    >
                      {hireSubmitting ? t('searchWorkersPage.hireSending') : t('searchWorkersPage.hireSubmit')}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
};

export default SearchWorkers;