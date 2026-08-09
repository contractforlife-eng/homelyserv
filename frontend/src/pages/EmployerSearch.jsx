import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { JOB_OPTIONS, getJobLabel as getJobLabelFromConstants } from '../constants/jobOptions';
import { QUICK_HIRE_PREMIUM_FEE } from '../config/monetization';
import { useDashboard } from '../components/layout/DashboardContext';
import { PremiumBadge, ActivelyLookingBadge } from '../components/PremiumBadge';
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
  Crown,
  SlidersHorizontal,
  LayoutGrid,
  List,
  BarChart3
} from 'lucide-react';

import employerService from '../services/employerService';

const EmployerSearch = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const dashboard = useDashboard();

  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allWorkers, setAllWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savedWorkers, setSavedWorkers] = useState([]);

  const [advancedFilters, setAdvancedFilters] = useState({
    minRating: 0,
    minExperience: 0,
    availability: 'all',
    maxHourlyRate: 100,
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

  const jobOptions = ['All Jobs', ...JOB_OPTIONS.map(job => job.label)];

  const experienceLevels = [
    { value: 0, label: 'Any Experience' },
    { value: 1, label: '1+ Years' },
    { value: 2, label: '2+ Years' },
    { value: 3, label: '3+ Years' },
    { value: 5, label: '5+ Years' },
    { value: 10, label: '10+ Years' }
  ];

  const ratingOptions = [
    { value: 0, label: 'Any Rating' },
    { value: 3, label: '3+ Stars' },
    { value: 3.5, label: '3.5+ Stars' },
    { value: 4, label: '4+ Stars' },
    { value: 4.5, label: '4.5+ Stars' }
  ];

  const languageOptions = [
    { value: 'all', label: 'All Languages' },
    { value: 'arabic', label: '🇸🇦 Arabic' },
    { value: 'english', label: '🇬🇧 English' },
    { value: 'french', label: '🇫🇷 French' },
    { value: 'turkish', label: '🇹🇷 Turkish' }
  ];

  const translations = {
    en: {
      title: 'Find Workers',
      subtitle: 'Discover skilled professionals for your home services',
      searchPlaceholder: 'Search by name, skills, or job title...',
      location: 'Location',
      selectLocation: 'All Locations',
      jobType: 'Job Type',
      selectJob: 'All Jobs',
      searchNow: 'Search',
      clearFilters: 'Clear All',
      results: 'Search Results',
      noResults: 'No workers found matching your criteria',
      tryAgain: 'Try adjusting your search filters',
      viewProfile: 'View Profile',
      hireNow: 'Hire Now',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Searching...',
      worker: 'Worker',
      rating: 'Rating',
      hourlyRate: 'Hourly Rate',
      experience: 'Experience',
      skills: 'Skills',
      filters: 'Filters',
      showFilters: 'Show Filters',
      hideFilters: 'Hide Filters',
      popular: 'Popular',
      advancedFilters: 'Advanced Filters',
      minRating: 'Minimum Rating',
      minExperience: 'Minimum Experience',
      availability: 'Availability',
      available: 'Available',
      unavailable: 'Unavailable',
      activelyLooking: 'Actively Looking',
      maxHourlyRate: 'Max Hourly Rate (EGP)',
      language: 'Language',
      sortBy: 'Sort By',
      relevance: 'Relevance',
      ratingHigh: 'Highest Rating',
      experienceHigh: 'Most Experienced',
      hourlyLow: 'Lowest Rate',
      hourlyHigh: 'Highest Rate',
      distance: 'Nearest Location',
      viewGrid: 'Grid View',
      viewList: 'List View',
      viewCompact: 'Compact View',
      saveWorker: 'Save Worker',
      compare: 'Compare',
      saved: 'Saved',
      experienceYears: 'years experience',
      hireSuccess: '✅ Offer sent to {name} successfully!',
      hireError: 'Failed to send offer. Please try again.',
      offerSent: 'Offer Sent',
      pendingResponse: 'Waiting for worker response...',
      contactHidden: 'Contact info hidden until payment confirmed',
      dailyLimitReached: 'Daily search limit reached. Upgrade to Premium for unlimited searches.',
      searchesRemaining: 'searches remaining today',
      unlimited: 'Unlimited',
      upgradePremium: 'Upgrade to Premium'
    },
    ar: {
      title: 'البحث عن عمال',
      subtitle: 'اكتشف المهنيين المهرة لخدمات منزلك',
      searchPlaceholder: 'ابحث بالاسم أو المهارات أو المسمى الوظيفي...',
      location: 'الموقع',
      selectLocation: 'جميع المواقع',
      jobType: 'نوع الوظيفة',
      selectJob: 'جميع الوظائف',
      searchNow: 'بحث',
      clearFilters: 'مسح الكل',
      results: 'نتائج البحث',
      noResults: 'لا يوجد عمال مطابقين لمعايير البحث',
      tryAgain: 'حاول تعديل فلاتر البحث',
      viewProfile: 'عرض الملف الشخصي',
      hireNow: 'توظيف الآن',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري البحث...',
      worker: 'العامل',
      rating: 'التقييم',
      hourlyRate: 'السعر بالساعة',
      experience: 'الخبرة',
      skills: 'المهارات',
      filters: 'فلاتر',
      showFilters: 'عرض الفلاتر',
      hideFilters: 'إخفاء الفلاتر',
      popular: 'الأكثر شهرة',
      advancedFilters: 'فلاتر متقدمة',
      minRating: 'الحد الأدنى للتقييم',
      minExperience: 'الحد الأدنى للخبرة',
      availability: 'التوفر',
      available: 'متاح',
      unavailable: 'غير متاح',
      activelyLooking: 'أبحث بنشاط',
      maxHourlyRate: 'الحد الأقصى للسعر (جنيه)',
      language: 'اللغة',
      sortBy: 'ترتيب حسب',
      relevance: 'الصلة',
      ratingHigh: 'أعلى تقييم',
      experienceHigh: 'أكثر خبرة',
      hourlyLow: 'أقل سعر',
      hourlyHigh: 'أعلى سعر',
      distance: 'الأقرب موقعاً',
      viewGrid: 'عرض شبكي',
      viewList: 'عرض قائمة',
      viewCompact: 'عرض مدمج',
      saveWorker: 'حفظ العامل',
      compare: 'مقارنة',
      saved: 'محفوظ',
      experienceYears: 'سنوات الخبرة',
      hireSuccess: '✅ تم إرسال العرض إلى {name} بنجاح!',
      hireError: 'فشل إرسال العرض. يرجى المحاولة مرة أخرى.',
      offerSent: 'تم إرسال العرض',
      pendingResponse: 'في انتظار رد العامل...',
      contactHidden: 'معلومات الاتصال مخفية حتى تأكيد الدفع',
      dailyLimitReached: 'تم الوصول إلى الحد اليومي للبحث. قم بالترقية إلى Premium للبحث غير المحدود.',
      searchesRemaining: 'عمليات بحث متبقية اليوم',
      unlimited: 'غير محدود',
      upgradePremium: 'الترقية إلى Premium'
    }
  };

  const t = translations[dashboard.language] || translations.en;

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
      setAdvancedFilters(restored.advancedFilters || {
        minRating: 0,
        minExperience: 0,
        availability: 'all',
        maxHourlyRate: 100,
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

    loadWorkersFromBackend();
  }, [authUser, isAuthenticated, authLoading, navigate]);

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
          fullName: profile.fullName || worker.fullName || worker.name || 'Worker',
          email: worker.email,
          phone: profile.phone || worker.phone || '',
          location: profile.location || worker.location || 'Not specified',
          bio: profile.bio || worker.bio || '',
          skills: profile.skills || worker.skills || [],
          experience: parseInt(profile.experience) || parseInt(worker.experience) || 0,
          hourlyRate: parseInt(profile.hourlyRate) || parseInt(worker.hourlyRate) || 30,
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
      language: 'all'
    });
    setSortBy('relevance');
    setShowResults(false);
    setSearchResults([]);
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
      alert('Please login first');
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
    return getJobLabelFromConstants(value);
  };

  const getUniqueLocations = () => {
    const locations = allWorkers
      .map(worker => worker.location)
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
        results = results.filter(worker => {
          const nameMatch = worker.fullName?.toLowerCase().includes(query);
          const skillMatch = worker.skills?.some(skill => skill.toLowerCase().includes(query));
          const jobMatch = worker.desiredJob?.toLowerCase().includes(query) ||
                          worker.jobTitle?.toLowerCase().includes(query);
          const bioMatch = worker.bio?.toLowerCase().includes(query);
          return nameMatch || skillMatch || jobMatch || bioMatch;
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
        results = results.filter(worker =>
          worker.location?.toLowerCase().includes(locLower)
        );
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

      if (advancedFilters.maxHourlyRate < 100) {
        results = results.filter(worker => (worker.hourlyRate || 0) <= advancedFilters.maxHourlyRate);
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
          results.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
          break;
        case 'hourlyHigh':
          results.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
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
  // 8. RENDER
  // ============================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
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
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={searchLimitStatus.isPremium}
        rightContent={
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'compact' : 'grid')}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
          >
            {viewMode === 'grid' && <LayoutGrid size={16} />}
            {viewMode === 'list' && <List size={16} />}
            {viewMode === 'compact' && <BarChart3 size={16} />}
          </button>
        }
      />

        <div className="p-4 md:p-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 md:p-8 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {authUser?.profileImage ? (
                    <img
                      src={authUser.profileImage}
                      alt={authUser.fullName || 'Employer'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                  {searchLimitStatus.isPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
                    {searchLimitStatus.isPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                      <Crown size={12} className="text-yellow-300" />
                      Premium
                    </span>
                    )}
                  </div>
                  <p className="text-teal-100 mt-1">{t.subtitle}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-teal-100">
                <Users size={18} className="flex-shrink-0" />
                <span>{allWorkers.length} workers available</span>
                {!searchLimitStatus.isPremium && !searchLimitStatus.limitReached && (
                  <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                    {searchLimitStatus.remaining} {t.searchesRemaining}
                  </span>
                )}
                {searchLimitStatus.limitReached && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-400/30 hover:bg-yellow-400/40 px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 border border-yellow-400/30"
                  >
                    <Crown size={12} className="text-yellow-300" />
                    {t.upgradePremium}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:bg-gray-900 transition flex items-center gap-2 text-gray-600 dark:text-gray-300"
              >
                <SlidersHorizontal size={18} />
                {showFilters ? t.hideFilters : t.showFilters}
              </button>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <SearchIcon size={18} />
                )}
                {t.searchNow}
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.jobType}</label>
                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                    >
                      {jobOptions.map((job) => (
                        <option key={job} value={job}>{job}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.location}</label>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800"
                    >
                      {locationOptionsDynamic.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t.advancedFilters}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t.minRating}</label>
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
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t.minExperience}</label>
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

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t.availability}</label>
                      <select
                        value={advancedFilters.availability}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, availability: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="all">All</option>
                        <option value="available">{t.available}</option>
                        <option value="unavailable">{t.unavailable}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t.maxHourlyRate}</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={advancedFilters.maxHourlyRate}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxHourlyRate: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        <span>10</span>
                        <span className="font-medium text-teal-600">{advancedFilters.maxHourlyRate} EGP</span>
                        <span>100</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t.language}</label>
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
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{t.sortBy}</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-sm"
                      >
                        <option value="relevance">{t.relevance}</option>
                        <option value="rating">{t.ratingHigh}</option>
                        <option value="experience">{t.experienceHigh}</option>
                        <option value="hourlyLow">{t.hourlyLow}</option>
                        <option value="hourlyHigh">{t.hourlyHigh}</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-teal-600 transition"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
              {searchLimitStatus.limitReached && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <LockIcon size={24} className="text-amber-600" />
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-300">{t.dailyLimitReached}</p>
                      <Link to="/subscription" className="text-sm text-teal-600 hover:underline mt-1 inline-block">
                        {t.upgradePremium}
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {showResults && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.results}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {searchResults.length} worker{searchResults.length !== 1 ? 's' : ''} found
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.noResults}</h3>
                  <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.tryAgain}</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    {t.clearFilters}
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
                      className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition ${
                        viewMode === 'compact' ? 'p-3' : ''
                      } ${worker.isPremium ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/30/10' : ''}`}
                    >
                      <div className={`flex ${viewMode === 'list' ? 'flex-row' : 'flex-col'} gap-4`}>
                        <div className={`flex items-start gap-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          <div className={`rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 relative ${
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
                            {worker.isPremium && (
                              <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                                <Crown size={viewMode === 'compact' ? 10 : 14} className="text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold text-gray-800 dark:text-white ${viewMode === 'compact' ? 'text-sm' : ''}`}>
                                  {worker.fullName}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1">
                                {worker.isPremium && <PremiumBadge label="Premium" size="sm" />}
                                {worker.activelyLooking && <ActivelyLookingBadge label={t.activelyLooking} size="sm" />}
                              </div>
                              </div>
                              <button
                                onClick={() => toggleSaveWorker(worker.id || worker.email)}
                                className="p-1 hover:bg-gray-100 dark:bg-gray-800 rounded"
                              >
                                <Heart
                                  size={viewMode === 'compact' ? 14 : 18}
                                  className={savedWorkers.includes(worker.id || worker.email) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}
                                />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                              <Briefcase size={viewMode === 'compact' ? 12 : 14} />
                              <span>{getJobLabel(worker.desiredJob)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                              <MapPin size={viewMode === 'compact' ? 12 : 14} />
                              <span className="truncate">{worker.location || 'Not specified'}</span>
                            </div>
                            {viewMode !== 'compact' && (
                              <>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                  <DollarSign size={14} />
                                  <span>EGP {worker.hourlyRate}/hr</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                  <StarIcon size={14} className="text-yellow-500" />
                                  <span>{worker.rating || 4.5} ★</span>
                                  <span className="text-gray-400 dark:text-gray-500">•</span>
                                  <span>{worker.experience || 0} {t.experienceYears}</span>
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
                              <span>{t.contactHidden}</span>
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
                          >
                            <Eye size={14} />
                            {viewMode === 'compact' ? '' : t.viewProfile}
                          </button>
                          <button
                            onClick={() => handleHireNow(worker)}
                            className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition flex items-center justify-center gap-1"
                          >
                            <UserPlus size={14} />
                            {t.hireNow}
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
