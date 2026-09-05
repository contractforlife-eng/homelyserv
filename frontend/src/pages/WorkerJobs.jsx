// src/pages/WorkerJobs.jsx — Find Jobs
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import { Search, MapPin, Calendar, Loader2, Briefcase, Building, Globe, AlertCircle } from 'lucide-react';
import jobService from '../services/jobService';
import externalJobService from '../services/externalJobService';
import ExternalJobCard from '../components/jobs/ExternalJobCard';
import AdzunaAttribution from '../components/jobs/AdzunaAttribution';
import JoobleAttribution from '../components/jobs/JoobleAttribution';
import { formatJobCompensation } from '../utils/jobCompensationDisplay';

const TYPE_LABELS = {
  'full-time': 'workerJobs.fullTime',
  'part-time': 'workerJobs.partTime',
  contract: 'workerJobs.contract',
  freelance: 'workerJobs.freelance',
};

const WorkerJobs = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isArabic = i18n.resolvedLanguage === 'ar';

  // Active Tab: 'internal' (default) | 'external'
  const [activeTab, setActiveTab] = useState('internal');

  // Internal Jobs state
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // External Jobs state
  const [externalJobs, setExternalJobs] = useState([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState('');
  const [externalQuery, setExternalQuery] = useState('');
  const [externalLocation, setExternalLocation] = useState('');
  const [externalCountryUnsupported, setExternalCountryUnsupported] = useState(false);
  const [externalCredentialsMissing, setExternalCredentialsMissing] = useState(false);
  const [externalCredentialsMissingMsg, setExternalCredentialsMissingMsg] = useState('');
  const [externalSearchTermRequired, setExternalSearchTermRequired] = useState(false);
  const [externalHasLoaded, setExternalHasLoaded] = useState(false);
  const [externalCountry, setExternalCountry] = useState(null);
  const [externalProvider, setExternalProvider] = useState(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters = {};
      if (query.trim()) filters.query = query.trim();
      if (location.trim()) filters.location = location.trim();
      if (employmentType) filters.employmentType = employmentType;

      const data = await jobService.getJobs(filters);
      if (data?.success) {
        setJobs(data.jobs || []);
      } else {
        setError(data?.message || t('workerJobs.emptyTitle'));
      }
    } catch (loadError) {
      console.error('Load jobs error:', loadError);
      setError(loadError.response?.data?.message || t('workerJobs.emptyTitle'));
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [query, location, employmentType, t]);

  const loadExternalJobs = useCallback(async (customWhat, customWhere) => {
    setExternalLoading(true);
    setExternalError('');
    setExternalCountryUnsupported(false);
    setExternalCredentialsMissing(false);
    setExternalSearchTermRequired(false);
    try {
      const whatParam = customWhat !== undefined ? customWhat : (externalQuery || authUser?.desiredJob || authUser?.profession || '');
      const whereParam = customWhere !== undefined ? customWhere : externalLocation;

      const data = await externalJobService.getExternalJobs({
        what: whatParam,
        where: whereParam
      });

      if (data?.country) {
        setExternalCountry(data.country);
      }
      if (data?.provider) {
        setExternalProvider(data.provider);
      }

      if (data?.success) {
        if (data.reason === 'COUNTRY_NOT_SUPPORTED' || data.supported === false) {
          setExternalCountryUnsupported(true);
          setExternalJobs([]);
        } else if (data.reason === 'SEARCH_TERM_REQUIRED') {
          setExternalSearchTermRequired(true);
          setExternalJobs([]);
        } else if (data.reason === 'JOOBLE_NOT_CONFIGURED' || data.reason === 'JOOBLE_EG_NOT_CONFIGURED' || (data.provider === 'jooble' && (data.reason === 'CREDENTIALS_MISSING' || data.configured === false))) {
          setExternalCredentialsMissing(true);
          setExternalCredentialsMissingMsg(t('externalJobs.joobleSetupRequired', 'External job search for this market is not currently configured.'));
          setExternalJobs([]);
        } else if (data.reason === 'ADZUNA_NOT_CONFIGURED' || data.reason === 'ADZUNA_CREDENTIALS_MISSING' || (data.provider === 'adzuna' && data.configured === false) || data.configured === false) {
          setExternalCredentialsMissing(true);
          setExternalCredentialsMissingMsg(t('externalJobs.setupRequiredDesc', 'External job search is not currently configured in the server environment.'));
          setExternalJobs([]);
        } else if (data.error === 'ADZUNA_RATE_LIMITED' || data.error === 'JOOBLE_RATE_LIMITED') {
          setExternalError(t('externalJobs.rateLimited', 'External job search is currently rate-limited. Please wait a moment and try again.'));
          setExternalJobs([]);
        } else if (data.error === 'ADZUNA_TIMEOUT' || data.error === 'JOOBLE_TIMEOUT') {
          setExternalError(t('externalJobs.timeout', 'External job search timed out. Please try again shortly.'));
          setExternalJobs([]);
        } else if (data.error === 'ADZUNA_UPSTREAM_ERROR' || data.error === 'JOOBLE_UPSTREAM_ERROR') {
          setExternalError(t('externalJobs.upstreamError', 'Unable to load external opportunities due to a temporary provider issue. Internal HomelyServ jobs remain available.'));
          setExternalJobs([]);
        } else {
          setExternalJobs(data.jobs || []);
        }
      } else {
        setExternalError(data?.message || t('externalJobs.error', 'Failed to load external opportunities.'));
      }
    } catch (err) {
      console.error('Load external jobs error:', err);
      setExternalError(err.response?.data?.message || t('externalJobs.error', 'Failed to load external opportunities.'));
    } finally {
      setExternalLoading(false);
      setExternalHasLoaded(true);
    }
  }, [externalQuery, externalLocation, authUser, t]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    loadJobs();
  }, [authLoading, isAuthenticated, authUser, navigate, loadJobs]);

  // Load external jobs lazily when worker switches to external tab for the first time
  useEffect(() => {
    if (activeTab === 'external' && !externalHasLoaded && !externalLoading) {
      // Prepopulate external query with desired job if empty
      if (!externalQuery && authUser?.desiredJob) {
        setExternalQuery(authUser.desiredJob);
      }
      loadExternalJobs(authUser?.desiredJob || '', externalLocation);
    }
  }, [activeTab, externalHasLoaded, externalLoading, externalQuery, externalLocation, authUser, loadExternalJobs]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadJobs();
  };

  const handleClear = () => {
    setQuery('');
    setLocation('');
    setEmploymentType('');
  };

  const handleExternalSearch = (e) => {
    e.preventDefault();
    loadExternalJobs(externalQuery, externalLocation);
  };

  const handleExternalClear = () => {
    setExternalQuery('');
    setExternalLocation('');
    loadExternalJobs('', '');
  };

  const formatSalary = (job) => formatJobCompensation(job, t, i18n.resolvedLanguage);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const employerDisplayName = (job) => {
    const raw = job.employerName || job.employer?.name || '';
    if (raw && !raw.startsWith('68') && !raw.startsWith('69') && !raw.startsWith('user_')) {
      return raw;
    }
    return '';
  };

  const isJoobleProvider = externalProvider === 'jooble';

  return (
    <DashboardLayout role="worker">
      <DashboardHeader />
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <RolePageHeader
            role="worker"
            title={t('workerJobs.title')}
            subtitle={t('workerJobs.subtitle')}
          />

          {/* TAB SELECTOR: Internal HomelyServ Jobs vs External Opportunities */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('internal')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'internal'
                  ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Briefcase size={16} />
              <span>{t('externalJobs.homelyServJobs', 'HomelyServ Jobs')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('external')}
              className={`py-3 px-6 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'external'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Globe size={16} />
              <span>{t('externalJobs.externalOpportunities', 'External Opportunities')}</span>
              {externalProvider && (
                <span className="text-2xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  {externalProvider === 'jooble' ? 'Jooble' : (externalProvider === 'adzuna' ? t('externalJobs.partnerBadge', 'Adzuna') : externalProvider.toUpperCase())}
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: HomelyServ Jobs (Standard Marketplace) */}
          {activeTab === 'internal' && (
            <>
              {/* Internal Search Filters */}
              <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t('workerJobs.searchPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder={t('workerJobs.locationPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">{t('workerJobs.allTypes')}</option>
                      <option value="full-time">{t('workerJobs.fullTime')}</option>
                      <option value="part-time">{t('workerJobs.partTime')}</option>
                      <option value="contract">{t('workerJobs.contract')}</option>
                      <option value="freelance">{t('workerJobs.freelance')}</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    <Search size={16} /> {t('workerJobs.title')}
                  </button>
                  {(query || location || employmentType) && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                    >
                      {t('workerJobs.clearFilters')}
                    </button>
                  )}
                </div>
              </form>

              {/* Internal Jobs List State Handling */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-teal-600 mx-auto" />
                </div>
              ) : hasLoaded && jobs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {t('workerJobs.emptyTitle')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('workerJobs.emptyDesc')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-white break-words">{job.jobTitle}</h2>
                          {job.isUrgent && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {t('workerJobs.urgent')}
                            </span>
                          )}
                          {job.isFeatured && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              {t('workerJobs.featured')}
                            </span>
                          )}
                        </div>

                        {employerDisplayName(job) && (
                          <p className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <Building size={15} className="text-gray-400 dark:text-gray-500" />
                            {employerDisplayName(job)}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={14} /> {job.location || t('workerJobs.noLocation')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Briefcase size={14} /> {TYPE_LABELS[job.employmentType] ? t(TYPE_LABELS[job.employmentType]) : job.employmentType}
                          </span>
                          <span>
                            {t('workerJobs.salary')}: <span className="text-gray-700 dark:text-gray-300 font-medium">{formatSalary(job)}</span>
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={14} /> {t('workerJobs.posted')}: {formatDate(job.createdAt)}
                          </span>
                        </div>

                        <div className="flex justify-start">
                          <button
                            onClick={() => navigate(`/job/${job.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                          >
                            {t('workerJobs.viewJob')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* TAB 2: External Opportunities (Adzuna / Jooble) */}
          {activeTab === 'external' && (
            <>
              {/* External Banner Attribution & Disclaimer */}
              {externalProvider === 'jooble' ? (
                <JoobleAttribution country={externalCountry} variant="banner" className="mb-6" />
              ) : externalProvider === 'adzuna' ? (
                <AdzunaAttribution country={externalCountry} variant="banner" className="mb-6" />
              ) : (
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs text-gray-600 dark:text-gray-300 mb-6">
                  <span className="font-semibold text-indigo-800 dark:text-indigo-300">
                    {t('externalJobs.disclaimerGeneral', 'External opportunities are provided by third parties and availability may vary by region.')}
                  </span>
                </div>
              )}

              {/* External Search Bar */}
              <form onSubmit={handleExternalSearch} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/40 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={externalQuery}
                      onChange={(e) => setExternalQuery(e.target.value)}
                      placeholder={t('externalJobs.searchPlaceholder', 'Keyword or job title (e.g. Caregiver, Nurse, Driver)...')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={externalLocation}
                      onChange={(e) => setExternalLocation(e.target.value)}
                      placeholder={t('workerJobs.locationPlaceholder')}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      <Search size={16} /> {t('externalJobs.searchButton', 'Search External')}
                    </button>
                    {(externalQuery || externalLocation) && (
                      <button
                        type="button"
                        onClick={handleExternalClear}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                      >
                        {t('workerJobs.clearFilters')}
                      </button>
                    )}
                  </div>
                  {externalProvider === 'jooble' ? (
                    <JoobleAttribution country={externalCountry} />
                  ) : externalProvider === 'adzuna' ? (
                    <AdzunaAttribution country={externalCountry} />
                  ) : null}
                </div>
              </form>

              {/* State handling */}
              {externalSearchTermRequired && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center mb-6">
                  <Search size={32} className="text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    {t('externalJobs.searchTermRequired', 'Please enter a search keyword with at least 2 characters to view external opportunities.')}
                  </h3>
                </div>
              )}

              {externalCountryUnsupported && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 text-center mb-6">
                  <Globe size={32} className="text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    {t('externalJobs.unsupportedCountryTitle', 'External Listings Unavailable in Your Country')}
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 max-w-md mx-auto">
                    {t('externalJobs.unsupportedCountryDesc', 'External job listings are not currently available for your country. You can continue using HomelyServ internal job opportunities.')}
                  </p>
                </div>
              )}

              {externalCredentialsMissing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center mb-6">
                  <AlertCircle size={32} className="text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    {externalProvider === 'jooble'
                      ? t('externalJobs.joobleSetupRequiredTitle', 'Jooble Integration Pending')
                      : externalProvider === 'adzuna'
                      ? t('externalJobs.setupRequiredTitle', 'Adzuna Integration Pending')
                      : t('externalJobs.setupRequiredTitleGeneral', 'Integration Pending')}
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 max-w-md mx-auto">
                    {externalCredentialsMissingMsg || t('externalJobs.setupRequiredDesc', 'External job search requires configuration in the server environment.')}
                  </p>
                </div>
              )}

              {externalError && !externalLoading && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-200 text-red-700 dark:text-red-400">
                  {externalError}
                </div>
              )}

              {externalLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={32} className="animate-spin text-indigo-600 mx-auto" />
                </div>
              ) : externalHasLoaded && !externalCountryUnsupported && !externalCredentialsMissing && !externalSearchTermRequired && !externalError && externalJobs.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                  <div className="text-5xl mb-4">🌐</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                    {t('externalJobs.emptyTitle', 'No external opportunities found')}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('externalJobs.emptyDesc', 'Try searching for different keywords or broadening your location.')}
                  </p>
                </div>
              ) : !externalCountryUnsupported && !externalCredentialsMissing && !externalSearchTermRequired && !externalError && externalJobs.length > 0 ? (
                <div className="space-y-4">
                  {externalJobs.map((job) => (
                    <ExternalJobCard key={job.id} job={job} country={externalCountry} />
                  ))}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkerJobs;
