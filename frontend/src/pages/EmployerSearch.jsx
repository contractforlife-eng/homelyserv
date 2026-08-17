import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { JOB_OPTIONS } from '../constants/jobOptions';
import { QUICK_HIRE_PREMIUM_FEE } from '../config/monetization';
import { PremiumBadge, ActivelyLookingBadge } from '../components/PremiumBadge';
import { UserDisplayName } from '../components/users';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  User,
  Briefcase,
  Search as SearchIcon,
  DollarSign,
  MapPin,
  Users,
  StarIcon,
  Heart,
  UserPlus,
  Eye,
  Lock as LockIcon,
  SlidersHorizontal,
  LayoutGrid,
  List,
  BarChart3,
  X,
  ChevronDown
} from 'lucide-react';

import employerService from '../services/employerService';
import { resolveArabicJobAlias } from '../utils/arabicJobSearchAliases';
import { getTutorSpecializationLabel } from '../constants/tutorSpecializations';
import {
  compareWorkerRates,
  formatWorkerRate,
  getComparableWorkerRate
} from '../utils/workerRateDisplay';

const SEARCH_CURRENCIES = ['EGP', 'USD', 'EUR', 'GBP', 'SAR', 'AED'];

const getInitialSearchCurrency = (user) => {
  if (SEARCH_CURRENCIES.includes(user?.preferredCurrency)) return user.preferredCurrency;
  if (SEARCH_CURRENCIES.includes(user?.effectiveCurrency)) return user.effectiveCurrency;
  return 'EGP';
};

const EmployerSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allWorkers, setAllWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedWorkers, setSavedWorkers] = useState([]);
  const [searchCurrency, setSearchCurrency] = useState(() => getInitialSearchCurrency(authUser));
  const searchCurrencyInitializedRef = useRef(Boolean(authUser));

  const [advancedFilters, setAdvancedFilters] = useState({
    minRating: 0,
    minExperience: 0,
    availability: 'all',
    maxHourlyRate: 100,
    maxHourlyRateActive: false,
    language: 'all'
  });

  const [searchLimitStatus, setSearchLimitStatus] = useState({
    count: 0,
    limit: 3,
    remaining: 3,
    isPremium: false,
    limitReached: false
  });

  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState('grid');

  // Dynamic hourly rate maximum based on real worker data
  const getDynamicHourlyMax = (currency = searchCurrency) => {
    const comparableRates = allWorkers
      .map(getComparableWorkerRate)
      .filter(rate => rate?.currency === currency)
      .map(rate => rate.amount);
    if (comparableRates.length === 0) return 100;
    const maxRate = Math.max(...comparableRates);
    // Round up to nearest 50 for clean UX, but never below actual max
    return Math.ceil(maxRate / 50) * 50 || 100;
  };

  const dynamicHourlyMax = getDynamicHourlyMax();

  const jobOptions = ['All Jobs', ...JOB_OPTIONS.map(job => job.label)];

  const experienceLevels = [
    { value: 0, label: t('employerSearch.anyExperience') },
    ...[1, 2, 3, 5, 10].map(value => ({ value, label: t('employerSearch.yearsPlus', { count: value }) }))
  ];

  const ratingOptions = [
    { value: 0, label: t('employerSearch.anyRating') },
    ...[3, 3.5, 4, 4.5].map(value => ({ value, label: t('employerSearch.starsPlus', { rating: value }) }))
  ];

  const languageOptions = [
    { value: 'all', label: t('employerSearch.allLanguages') },
    { value: 'arabic', label: `🇸🇦 ${t('employerSearch.languages.arabic')}` },
    { value: 'english', label: `🇬🇧 ${t('employerSearch.languages.english')}` },
    { value: 'french', label: `🇫🇷 ${t('employerSearch.languages.french')}` },
    { value: 'turkish', label: `🇹🇷 ${t('employerSearch.languages.turkish')}` }
  ];

  // ============================================================
  // HELPER: Get display location for a worker
  // ============================================================
  const getWorkerDisplayLocation = (worker) => {
    if (!worker) return t('employerSearch.notSpecified');
    return (
      worker.location?.trim() ||
      worker.countryName?.trim() ||
      t('employerSearch.notSpecified')
    );
  };

  // ============================================================
  // HELPER: Check if worker has usable location
  // ============================================================
  const hasUsableLocation = (worker) => {
    if (!worker) return false;
    return !!(worker.location?.trim() || worker.countryName?.trim());
  };

  // ============================================================
  // 3. EFFECTS
  // ============================================================
  useEffect(() => {
    const saved = localStorage.getItem('employer_saved_workers');
    if (saved) {
      setSavedWorkers(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }

    // Restore the previous search results if we just returned from a worker
    // profile page (the search state was carried via route state — the same
    // state pattern already used for offer creation). This avoids showing an
    // empty results list after the profile page unmounted this component.
    const restored = location.state?.search;
    if (restored && Array.isArray(restored.searchResults)) {
      setSearchQuery(restored.searchQuery || '');
      setSelectedJob(restored.selectedJob || '');
      setSelectedLocation(restored.selectedLocation || '');
      const restoredCurrency = SEARCH_CURRENCIES.includes(restored.searchCurrency)
        ? restored.searchCurrency
        : getInitialSearchCurrency(authUser);
      setSearchCurrency(restoredCurrency);
      searchCurrencyInitializedRef.current = true;
      setAdvancedFilters(restored.advancedFilters ? {
        ...restored.advancedFilters,
        maxHourlyRateActive: restored.advancedFilters.maxHourlyRateActive === true
      } : {
        minRating: 0,
        minExperience: 0,
        availability: 'all',
        maxHourlyRate: 100,
        maxHourlyRateActive: false,
        language: 'all'
      });
      setSortBy(restored.sortBy || 'relevance');
      setAllWorkers(restored.allWorkers || []);
      setSearchResults(restored.searchResults || []);
      setShowResults(true);
      if (restored.searchLimitStatus) {
        setSearchLimitStatus(restored.searchLimitStatus);
      }
      return;
    }

    if (!searchCurrencyInitializedRef.current) {
      setSearchCurrency(getInitialSearchCurrency(authUser));
      searchCurrencyInitializedRef.current = true;
    }

    loadWorkersFromBackend();
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Keep an inactive max filter at the selected currency's current ceiling.
  useEffect(() => {
    if (!advancedFilters.maxHourlyRateActive || advancedFilters.maxHourlyRate > dynamicHourlyMax) {
      setAdvancedFilters(prev => ({
        ...prev,
        maxHourlyRate: dynamicHourlyMax,
        maxHourlyRateActive: prev.maxHourlyRateActive && prev.maxHourlyRate < dynamicHourlyMax
      }));
    }
  }, [dynamicHourlyMax, advancedFilters.maxHourlyRate, advancedFilters.maxHourlyRateActive]);

  // ============================================================
  // 4. LOAD WORKERS FROM BACKEND
  // ============================================================
  const loadWorkersFromBackend = async () => {
    setLoading(true);
    try {
      const data = await employerService.searchWorkers();
      if (data.success) {
        const workers = (data.workers || []).map(w => ({
          ...w,
          id: w.id || w._id,
          profileImage: isBase64Image(w.profileImage) ? '' : (w.profileImage || w.image || '')
        }));
        setAllWorkers(workers);
        setSearchLimitStatus({
          count: data.searchCount || 0,
          limit: data.searchLimit || 3,
          remaining: data.remaining ?? 3,
          isPremium: data.isPremium || false,
          limitReached: false
        });
        console.log(`✅ Loaded ${workers.length} workers from backend`);
      } else if (data.message && data.message.includes('Daily search limit reached')) {
        setSearchLimitStatus({
          count: data.searchCount || 3,
          limit: data.searchLimit || 3,
          remaining: 0,
          isPremium: false,
          limitReached: true
        });
        setAllWorkers([]);
      } else {
        throw new Error(data.message || 'Failed to load workers');
      }
    } catch (error) {
      console.error('Error loading workers from backend:', error);
      loadWorkersFromStorage();
    } finally {
      setLoading(false);
    }
  };

  const isBase64Image = (str) => typeof str === 'string' && str.startsWith('data:image/');

  // Fallback: load workers from localStorage if backend fails
  const loadWorkersFromStorage = () => {
    try {
      console.log('📂 Loading workers from localStorage (fallback)...');

      const allUsers = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const workers = allUsers.filter(user => user.role === 'WORKER');

      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');

      const mergedWorkers = workers.map(worker => {
        const profile = profiles[worker.email] || {};
        const workerId = worker.id || worker._id || worker.email;
        const rawProfileImage = profile.profileImage || worker.profileImage || '';

        return {
          ...worker,
          ...profile,
          id: workerId,
          fullName: profile.fullName || worker.fullName || worker.name || t('employerSearch.worker'),
          email: worker.email,
          phone: profile.phone || worker.phone || '',
          location: profile.location || worker.location || '',
          countryName: profile.countryName || worker.countryName || '',
          bio: profile.bio || worker.bio || '',
          skills: profile.skills || worker.skills || [],
          experience: parseInt(profile.experience) || parseInt(worker.experience) || 0,
          hourlyRate: profile.hourlyRate ?? worker.hourlyRate ?? null,
          hourlyRateDisplayValue: profile.hourlyRate ?? worker.hourlyRate ?? null,
          hourlyRateCurrency: profile.hourlyRateCurrency ?? worker.hourlyRateCurrency ?? null,
          desiredJob: profile.desiredJob || worker.desiredJob || '',
          profileImage: isBase64Image(rawProfileImage) ? '' : rawProfileImage,
          rating: profile.rating || worker.rating || 4.5,
          jobsCompleted: profile.jobsCompleted || worker.jobsCompleted || 0,
          available: profile.available !== undefined ? profile.available : true,
          role: 'WORKER',
          languages: profile.languages || worker.languages || ['english'],
          // Fallback data is NOT a premium authority: never derive premium
          // entitlement from localStorage.
          isPremium: false,
          activelyLooking: false
        };
      });

      setAllWorkers(mergedWorkers);
      console.log(`✅ Loaded ${mergedWorkers.length} workers from localStorage (fallback)`);

    } catch (error) {
      console.error('Error loading workers from storage:', error);
      setAllWorkers([]);
    }
  };

  // ============================================================
  // 5. HANDLERS
  // ============================================================
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedJob('');
    setSelectedLocation('');
    setAdvancedFilters({
      minRating: 0,
      minExperience: 0,
      availability: 'all',
      maxHourlyRate: 100,
      maxHourlyRateActive: false,
      language: 'all'
    });
    setSortBy('relevance');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleSearchCurrencyChange = (currency) => {
    searchCurrencyInitializedRef.current = true;
    setSearchCurrency(currency);
    setAdvancedFilters(prev => ({
      ...prev,
      maxHourlyRate: getDynamicHourlyMax(currency),
      maxHourlyRateActive: false
    }));
  };

  const toggleSaveWorker = (workerId) => {
    let newSaved;
    if (savedWorkers.includes(workerId)) {
      newSaved = savedWorkers.filter(id => id !== workerId);
    } else {
      newSaved = [...savedWorkers, workerId];
    }
    setSavedWorkers(newSaved);
    localStorage.setItem('employer_saved_workers', JSON.stringify(newSaved));
  };

  // ============================================================
  // 6. HIRE NOW - Navigate to offer creation form
  // ============================================================
  const handleHireNow = (worker) => {
    if (!isAuthenticated || !authUser) {
      alert(t('employerSearch.pleaseLogin'));
      return;
    }

    // Sanitize worker data and pass via React Router state
    const sanitizedWorker = {
      ...worker,
      profileImage: isBase64Image(worker.profileImage) ? '' : worker.profileImage
    };

    // Navigate to the offer creation form with worker data in state
    navigate('/employer-create-offer', { state: { worker: sanitizedWorker } });
  };

  const getJobLabel = (value) => {
    const option = JOB_OPTIONS.find(job => job.value === value);
    return option ? t(`employerSearch.jobs.${option.value}`) : (value || t('employerSearch.serviceNotSpecified'));
  };

  const getUniqueLocations = () => {
    const locations = allWorkers
      .map(worker => {
        // Prefer location, fallback to countryName
        const loc = worker.location?.trim() || worker.countryName?.trim();
        return loc;
      })
      .filter(location => location && location !== 'Not specified' && location !== '')
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['All Locations', ...locations.sort()];
  };

  const locationOptionsDynamic = getUniqueLocations();

  // ============================================================
  // 7. SEARCH FUNCTION
  // ============================================================
  const handleSearch = () => {
    console.log('🔍 Starting search...');
    console.log('📌 Selected Job:', selectedJob);
    console.log('📌 Search Query:', searchQuery);
    console.log('📌 All Workers:', allWorkers.length);

    setLoading(true);
    setShowResults(false);

    setTimeout(() => {
      let results = [...allWorkers];

      // AVAILABILITY HARD FILTER (defense-in-depth): the backend already
      // excludes Not Available workers from search results. This unconditional
      // filter guarantees no Not Available worker can ever render — including
      // via the localStorage fallback path — regardless of the availability
      // advanced filter or sort mode.
      results = results.filter(worker => worker.available !== false);

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const arabicCanonical = resolveArabicJobAlias(query);
        results = results.filter(worker => {
          const nameMatch = worker.fullName?.toLowerCase().includes(query);
          const skillMatch = worker.skills?.some(skill => skill.toLowerCase().includes(query));
          const jobMatch = worker.desiredJob?.toLowerCase().includes(query) ||
                          worker.jobTitle?.toLowerCase().includes(query);
          const bioMatch = worker.bio?.toLowerCase().includes(query);
          const arabicCanonicalJobMatch = arabicCanonical && worker.desiredJob === arabicCanonical;
          return nameMatch || skillMatch || jobMatch || bioMatch || arabicCanonicalJobMatch;
        });
        console.log(`📌 After text search: ${results.length} results`);
      }

      if (selectedJob && selectedJob !== 'All Jobs') {
        console.log(`🔍 Filtering by job: "${selectedJob}"`);

        const selectedJobValue = JOB_OPTIONS.find(
          job => job.label.toLowerCase() === selectedJob.toLowerCase()
        )?.value;

        console.log(`  - Selected job value: "${selectedJobValue}"`);

        results = results.filter(worker => {
          const workerValue = worker.desiredJob?.toLowerCase() || '';
          const workerLabel = JOB_OPTIONS.find(j => j.value === worker.desiredJob)?.label?.toLowerCase() || '';
          const searchLower = selectedJob.toLowerCase();

          const matchValue = workerValue === searchLower;
          const matchValueWithJobValue = selectedJobValue && workerValue === selectedJobValue;
          const matchLabel = workerLabel === searchLower;
          const matchPartial = workerValue.includes(searchLower) || workerLabel.includes(searchLower);

          const isMatch = matchValue || matchValueWithJobValue || matchLabel || matchPartial;

          if (isMatch) {
            console.log(`  ✅ Worker "${worker.fullName}" matches! (value: "${workerValue}", label: "${workerLabel}")`);
          }

          return isMatch;
        });

        console.log(`📌 After job filter: ${results.length} results`);
      }

      if (selectedLocation && selectedLocation !== 'All Locations') {
        const locLower = selectedLocation.toLowerCase();
        results = results.filter(worker => {
          const workerLocation = (worker.location || '').toLowerCase();
          const workerCountry = (worker.countryName || '').toLowerCase();
          return workerLocation.includes(locLower) || workerCountry.includes(locLower);
        });
        console.log(`📌 After location filter: ${results.length} results`);
      }

      if (advancedFilters.minRating > 0) {
        results = results.filter(worker => (worker.rating || 0) >= advancedFilters.minRating);
      }

      if (advancedFilters.minExperience > 0) {
        results = results.filter(worker => (worker.experience || 0) >= advancedFilters.minExperience);
      }

      if (advancedFilters.availability === 'available') {
        results = results.filter(worker => worker.available === true);
      } else if (advancedFilters.availability === 'unavailable') {
        results = results.filter(worker => worker.available === false);
      }

      if (advancedFilters.maxHourlyRateActive) {
        results = results.filter(worker => {
          const rate = getComparableWorkerRate(worker);
          return rate?.currency === searchCurrency && rate.amount <= advancedFilters.maxHourlyRate;
        });
      }

      if (advancedFilters.language !== 'all') {
        results = results.filter(worker =>
          worker.languages?.includes(advancedFilters.language)
        );
      }

      switch (sortBy) {
        case 'rating':
          results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'experience':
          results.sort((a, b) => (b.experience || 0) - (a.experience || 0));
          break;
        case 'hourlyLow':
          results.sort((a, b) => compareWorkerRates(a, b, searchCurrency, 1));
          break;
        case 'hourlyHigh':
          results.sort((a, b) => compareWorkerRates(a, b, searchCurrency, -1));
          break;
        case 'relevance':
        default:
          break;
      }

      console.log('✅ Final results:', results.length);
      setSearchResults(results);
      setShowResults(true);
      setLoading(false);
    }, 500);
  };

  // ============================================================
  // HELPER: Get featured workers for mini cards section
  // ============================================================
  const getFeaturedWorkers = () => {
    // Prefer workers that are available or actively looking
    // Exclude workers without usable location or profile image
    const featured = allWorkers
      .filter(worker => {
        const isAvailable = worker.available === true || worker.activelyLooking === true;
        const hasLocation = hasUsableLocation(worker);
        return isAvailable && hasLocation;
      })
      .slice(0, 8); // Max 8 workers

    return featured;
  };

  const featuredWorkers = getFeaturedWorkers();

  // ============================================================
  // 8. RENDER
  // ============================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employerSearch.pageLoading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t('employerSearch.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={searchLimitStatus.isPremium}
        rightContent={
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'compact' : 'grid')}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
            title={viewMode === 'grid' ? t('employerSearch.viewList') : viewMode === 'list' ? t('employerSearch.viewCompact') : t('employerSearch.viewGrid')}
            aria-label={viewMode === 'grid' ? t('employerSearch.viewList') : viewMode === 'list' ? t('employerSearch.viewCompact') : t('employerSearch.viewGrid')}
          >
            {viewMode === 'grid' && <LayoutGrid size={16} />}
            {viewMode === 'list' && <List size={16} />}
            {viewMode === 'compact' && <BarChart3 size={16} />}
          </button>
        }
      />

      <div className="p-4 md:p-6">
        {/* Welcome Banner / Search Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 md:p-8 mb-6 text-white">
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('employerSearch.title')}</h1>
              <p className="text-teal-100">{t('employerSearch.subtitle')}</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <SearchIcon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-200" />
              <input
                type="text"
                placeholder={t('employerSearch.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border-0 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            {/* Results Count */}
            {showResults && (
              <div className="text-sm text-teal-100">
                {t('employerSearch.workersAvailable', { count: searchResults.length })}
              </div>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-6">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Service Filter */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.jobType')}</label>
              <select
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
              >
                {jobOptions.map((job) => (
                  <option key={job} value={job}>{job === 'All Jobs' ? t('employerSearch.allJobs') : getJobLabel(JOB_OPTIONS.find(option => option.label === job)?.value)}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.location')}</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
              >
                {locationOptionsDynamic.map((loc) => (
                  <option key={loc} value={loc}>{loc === 'All Locations' ? t('employerSearch.allLocations') : loc}</option>
                ))}
              </select>
            </div>

            {/* Experience Filter */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.minExperience')}</label>
              <select
                value={advancedFilters.minExperience}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minExperience: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
              >
                {experienceLevels.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Max Hourly Rate */}
            <div className="w-full lg:w-48">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {t('employerSearch.maxHourlyRate').replace(/\s*\([^)]*\)\s*$/, '')} ({searchCurrency})
              </label>
              <input
                type="range"
                min="10"
                max={dynamicHourlyMax}
                step="5"
                value={advancedFilters.maxHourlyRate}
                onChange={(e) => {
                  const maxHourlyRate = parseInt(e.target.value);
                  setAdvancedFilters(prev => ({
                    ...prev,
                    maxHourlyRate,
                    maxHourlyRateActive: maxHourlyRate < dynamicHourlyMax
                  }));
                }}
                className="w-full"
              />
              <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                {advancedFilters.maxHourlyRate} {searchCurrency}
              </div>
            </div>

            {/* Hourly Rate Comparison Currency */}
            <div className="w-full lg:w-32">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {t('employerSettings.currency')}
              </label>
              <select
                value={searchCurrency}
                onChange={(e) => handleSearchCurrencyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
              >
                {SEARCH_CURRENCIES.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>

            {/* Availability */}
            <div className="w-full lg:w-40">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.availability')}</label>
              <select
                value={advancedFilters.availability}
                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, availability: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="all">{t('employerSearch.all')}</option>
                <option value="available">{t('employerSearch.available')}</option>
                <option value="unavailable">{t('employerSearch.unavailable')}</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SearchIcon size={16} />
                )}
                {t('employerSearch.searchNow')}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition text-sm"
              >
                {t('employerSearch.clearFilters')}
              </button>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 transition"
            >
              <SlidersHorizontal size={16} />
              {showFilters ? t('employerSearch.hideFilters') : t('employerSearch.showFilters')}
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {showFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.minRating')}</label>
                  <select
                    value={advancedFilters.minRating}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
                  >
                    {ratingOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.language')}</label>
                  <select
                    value={advancedFilters.language}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
                  >
                    {languageOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t('employerSearch.sortBy')}</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="relevance">{t('employerSearch.relevance')}</option>
                    <option value="rating">{t('employerSearch.ratingHigh')}</option>
                    <option value="experience">{t('employerSearch.experienceHigh')}</option>
                    <option value="hourlyLow">{t('employerSearch.hourlyLow')}</option>
                    <option value="hourlyHigh">{t('employerSearch.hourlyHigh')}</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Available Workers Mini Cards Section */}
        {featuredWorkers.length > 0 && !searchLimitStatus.limitReached && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{t('employerSearch.availableWorkers')}</h2>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {featuredWorkers.map((worker) => {
                  const displayRate = formatWorkerRate(worker, t, 'employerSearch.rateNotSpecified');

                   return (
                     <div
                       key={worker.id || worker.email}
                      className={`flex-shrink-0 w-48 rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col border ${
                        worker.isPremium
                          ? 'border-purple-400 dark:border-purple-500 bg-purple-100/80 dark:bg-purple-900/30 shadow-[0_0_16px_rgba(168,85,247,0.40)] hover:shadow-[0_0_22px_rgba(168,85,247,0.50)]'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm'
                      }`}
                     >
                       {/* Worker Photo */}
                       <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                         {worker.profileImage ? (
                           <img
                             src={worker.profileImage}
                             alt={worker.fullName}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center">
                             <User size={48} className="text-gray-400 dark:text-gray-500" />
                           </div>
                         )}
                       </div>

                      {/* Worker Info */}
                      <div className="p-3 flex flex-col flex-1">
                        {/* Worker Name */}
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-1 truncate">
                          <UserDisplayName user={worker} name={t('employerSearch.worker')} size="lg" />
                        </h3>

                          {/* Worker Job / Service */}
                          <div className="text-xs text-teal-700 dark:text-teal-400 font-medium mb-1 truncate">
                            {getJobLabel(worker.desiredJob) || (worker.skills && worker.skills.length > 0 ? worker.skills[0] : t('employerSearch.serviceNotSpecified'))}
                            {worker.desiredJob === 'tutor' && worker.tutorSpecialization ? (
                              <span className="text-teal-600"> — {getTutorSpecializationLabel(worker.tutorSpecialization, t)}</span>
                            ) : null}
                          </div>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <MapPin size={12} className="flex-shrink-0" />
                          <span className="truncate">{getWorkerDisplayLocation(worker)}</span>
                        </div>

                        {/* Hourly Rate */}
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                          {displayRate}
                        </div>

                        {/* Hire Now Button - pushed to bottom */}
                        <div className="mt-auto">
                          <button
                            onClick={() => handleHireNow(worker)}
                            className="w-full px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <UserPlus size={14} />
                            {t('employerSearch.hireNow')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Search Limit Warning */}
        {searchLimitStatus.limitReached && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-3">
              <LockIcon size={24} className="text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">{t('employerSearch.dailyLimitReached')}</p>
                <Link to="/subscription" className="text-sm text-teal-600 hover:underline mt-1 inline-block">
                  {t('employerSearch.upgradePremium')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Results */}
        {showResults && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('employerSearch.results')}</h3>
              <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {t('employerSearch.workersFound', { count: searchResults.length })}
              </span>
            </div>

            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('employerSearch.noResults')}</h3>
                <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('employerSearch.tryAgain')}</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                >
                  {t('employerSearch.clearFilters')}
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                : viewMode === 'list'
                ? 'space-y-4'
                : 'grid grid-cols-1 md:grid-cols-3 gap-3'
              }>
                {searchResults.map((worker) => (
                  <div
                    key={worker.id || worker.email}
                    className={`border rounded-lg p-4 transition ${
                      viewMode === 'compact' ? 'p-3' : ''
                    } ${
                      worker.isPremium
                        ? 'border-purple-400 dark:border-purple-500 bg-purple-100/80 dark:bg-purple-900/30 shadow-[0_0_16px_rgba(168,85,247,0.40)] hover:shadow-[0_0_22px_rgba(168,85,247,0.50)]'
                        : 'border-gray-200 dark:border-gray-700 hover:shadow-md'
                    }`}
                  >
                    <div className={`flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'} gap-4`}>
                      <div className={`flex items-start gap-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                        <div className={`rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 ${
                          viewMode === 'compact' ? 'w-12 h-12' : 'w-16 h-16'
                        }`}>
                          {worker.profileImage ? (
                            <img
                              src={worker.profileImage}
                              alt={worker.fullName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User size={viewMode === 'compact' ? 20 : 28} className="text-teal-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-semibold text-gray-800 dark:text-white ${viewMode === 'compact' ? 'text-sm' : ''}`}>
                                <UserDisplayName user={worker} size="xl" />
                              </h4>
                              <div className={`flex flex-wrap items-center gap-1 ${
                                worker.isPremium ? 'rounded-md bg-orange-50 border border-orange-200 text-orange-600 dark:bg-orange-900/25 dark:border-orange-700/50 dark:text-orange-300 px-2 py-1' : ''
                              }`}>
                                {worker.isPremium && <PremiumBadge label={t('employerSearch.premium')} size="sm" />}
                                {worker.activelyLooking && <ActivelyLookingBadge label={t('employerSearch.activelyLooking')} size="sm" />}
                              </div>
                            </div>
                            <button
                              onClick={() => toggleSaveWorker(worker.id || worker.email)}
                              className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded"
                              title={savedWorkers.includes(worker.id || worker.email) ? t('employerSearch.saved') : t('employerSearch.saveWorker')}
                              aria-label={savedWorkers.includes(worker.id || worker.email) ? t('employerSearch.saved') : t('employerSearch.saveWorker')}
                            >
                              <Heart
                                size={viewMode === 'compact' ? 14 : 18}
                                className={savedWorkers.includes(worker.id || worker.email) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}
                              />
                            </button>
                          </div>
                           <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                             <Briefcase size={viewMode === 'compact' ? 12 : 14} />
                              <span>
                                {getJobLabel(worker.desiredJob)}
                                {worker.desiredJob === 'tutor' && worker.tutorSpecialization ? (
                                  <> — {getTutorSpecializationLabel(worker.tutorSpecialization, t)}</>
                                ) : null}
                              </span>
                           </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            <MapPin size={viewMode === 'compact' ? 12 : 14} />
                            <span className="truncate">{getWorkerDisplayLocation(worker)}</span>
                          </div>
                          {viewMode !== 'compact' && (
                            <>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                <DollarSign size={14} />
                                <span>{formatWorkerRate(worker, t, 'employerSearch.rateNotSpecified')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                <StarIcon size={14} className="text-yellow-500" />
                                <span>{worker.rating || 4.5} ★</span>
                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                <span>{t('employerSearch.experienceYears', { count: worker.experience || 0 })}</span>
                              </div>
                            </>
                          )}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {worker.skills?.slice(0, viewMode === 'compact' ? 2 : 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {worker.skills?.length > (viewMode === 'compact' ? 2 : 3) && (
                              <span className="px-2 py-0.5 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs rounded-full">
                                +{worker.skills.length - (viewMode === 'compact' ? 2 : 3)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <LockIcon size={12} />
                            <span>{t('employerSearch.contactHidden')}</span>
                          </div>
                        </div>
                      </div>
                      <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-wrap items-center' : ''}`}>
                        <button
                          onClick={() => {
                            const sanitizedWorker = { ...worker, profileImage: isBase64Image(worker.profileImage) ? '' : worker.profileImage };
                            // Pass the current search snapshot alongside the
                            // worker so the profile's Back button can restore
                            // this page (results + filters) without reloading.
                            navigate('/worker-profile-view', {
                              state: {
                                worker: sanitizedWorker,
                                search: {
                                  searchQuery,
                                  selectedJob,
                                  selectedLocation,
                                  searchCurrency,
                                  advancedFilters,
                                  sortBy,
                                  allWorkers,
                                  searchResults,
                                  showResults,
                                  searchLimitStatus
                                }
                              }
                            });
                          }}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition flex items-center justify-center gap-1"
                          title={t('employerSearch.viewProfile')}
                          aria-label={t('employerSearch.viewProfile')}
                        >
                          <Eye size={14} />
                          {viewMode === 'compact' ? '' : t('employerSearch.viewProfile')}
                        </button>
                        <button
                          onClick={() => handleHireNow(worker)}
                          className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition flex items-center justify-center gap-1"
                        >
                          <UserPlus size={14} />
                          {t('employerSearch.hireNow')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EmployerSearch;
