// src/pages/employer/EmployerSearch.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  Briefcase,
  FileCheck,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  AlertTriangle,
  Search,
  DollarSign,
  Clock,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  Users,
  Filter,
  FileText,
  Search as SearchIcon,
  UserCheck,
  Building2,
  MapPinned,
  Languages,
  Star as StarIcon,
  CheckCircle,
  Eye,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Shield
} from 'lucide-react';
import { JOB_OPTIONS, getJobLabel, getJobLabels } from '../constants/jobOptions';

// Employer Sidebar Component (keep your existing code)
const EmployerSidebar = ({ 
  language, 
  sidebarCollapsed, 
  toggleSidebar, 
  mobileMenuOpen, 
  toggleMobileMenu, 
  user, 
  handleLogout 
}) => {
  const location = useLocation();

  const translations = {
    en: {
      dashboard: 'Dashboard',
      myProfile: 'My Profile',
      myHires: 'My Hires',
      search: 'Search Workers',
      messages: 'Messages',
      complaints: 'Complaints',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview'
    },
    ar: {
      dashboard: 'لوحة التحكم',
      myProfile: 'ملفي الشخصي',
      myHires: 'توظيفاتي',
      search: 'البحث عن عمال',
      messages: 'الرسائل',
      complaints: 'الشكاوى',
      settings: 'الإعدادات',
      help: 'المساعدة والدعم',
      logout: 'تسجيل الخروج',
      overview: 'نظرة عامة'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/employer-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/employer-profile' },
    { id: 'hires', label: t.myHires, icon: FileCheck, path: '/my-hires' },
    { id: 'search', label: t.search, icon: Search, path: '/employer-search' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/employer-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/employer-complaints' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      <aside 
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <Link to="/employer-dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/employer-dashboard" className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">H</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors hidden lg:block"
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <div className={`p-4 border-b border-gray-200 ${sidebarCollapsed ? 'text-center' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-teal-600" />
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email || 'employer@homelyserv.com'}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {t.overview}
            </div>
          )}
          {sidebarCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              •
            </div>
          )}

          {menuItems.map((item) => (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive(item.path)
                  ? 'bg-teal-50 text-teal-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-teal-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-teal-600 rounded-full"></div>
              )}
            </Link>
          ))}

          <div className="border-t border-gray-200 my-3"></div>

          <Link
            to="/employer-settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <Settings size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.settings}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.settings}
              </div>
            )}
          </Link>
          <Link
            to="/help"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <HelpCircle size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.help}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.help}
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-teal-600 hover:bg-teal-50 group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {!sidebarCollapsed && <span className="text-sm font-medium">{t.logout}</span>}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {t.logout}
              </div>
            )}
          </button>
        </nav>
      </aside>
    </>
  );
};

// Main EmployerSearch Component - Using shared job options
const EmployerSearch = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [allWorkers, setAllWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Use shared job options - just the labels for the dropdown
  const jobLabels = getJobLabels();

  // Get unique locations from workers
  const getUniqueLocations = () => {
    const locations = allWorkers
      .map(worker => worker.location)
      .filter(location => location && location !== 'Not specified' && location !== '')
      .filter((value, index, self) => self.indexOf(value) === index);
    return locations.sort();
  };

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
      hire: 'Hire Now',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Searching...',
      worker: 'Worker',
      rating: 'Rating',
      hourlyRate: 'Hourly Rate',
      location: 'Location',
      experience: 'Experience',
      skills: 'Skills',
      filters: 'Filters',
      showFilters: 'Show Filters',
      hideFilters: 'Hide Filters',
      popular: 'Popular',
      noLocations: 'No locations available'
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
      hire: 'توظيف الآن',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري البحث...',
      worker: 'العامل',
      rating: 'التقييم',
      hourlyRate: 'السعر بالساعة',
      location: 'الموقع',
      experience: 'الخبرة',
      skills: 'المهارات',
      filters: 'فلاتر',
      showFilters: 'عرض الفلاتر',
      hideFilters: 'إخفاء الفلاتر',
      popular: 'الأكثر شهرة',
      noLocations: 'لا توجد مواقع متاحة'
    }
  };

  const t = translations[language];

  // Load workers from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) {
      setLanguage(savedLang);
    }
    
    const userData = localStorage.getItem('homelyserv_user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.role !== 'EMPLOYER') {
          navigate('/login');
          return;
        }
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    loadWorkersFromStorage();
  }, [navigate]);

  const loadWorkersFromStorage = () => {
    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      console.log('📋 All users from localStorage:', users);
      
      const workers = users.filter(user => user.role === 'WORKER');
      console.log('👷 Found workers:', workers);
      
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      console.log('📋 Profiles:', profiles);
      
      const mergedWorkers = workers.map(worker => {
        const profile = profiles[worker.email] || {};
        return {
          ...worker,
          ...profile,
          fullName: profile.fullName || worker.fullName || worker.name || 'Worker',
          email: worker.email,
          phone: profile.phone || worker.phone || '',
          location: profile.location || worker.location || 'Not specified',
          bio: profile.bio || worker.bio || '',
          skills: profile.skills || worker.skills || [],
          experience: profile.experience || worker.experience || '0 years',
          hourlyRate: profile.hourlyRate || worker.hourlyRate || '30',
          desiredJob: profile.desiredJob || worker.desiredJob || '',
          profileImage: profile.profileImage || worker.profileImage || '',
          rating: profile.rating || worker.rating || 4.5,
          jobsCompleted: profile.jobsCompleted || worker.jobsCompleted || 0,
          available: profile.available !== undefined ? profile.available : true,
          role: 'WORKER'
        };
      });
      
      console.log('✅ Merged workers:', mergedWorkers);
      setAllWorkers(mergedWorkers);
      
      // Log unique locations
      const locations = mergedWorkers
        .map(w => w.location)
        .filter(loc => loc && loc !== 'Not specified' && loc !== '');
      console.log('📍 Unique locations found:', [...new Set(locations)]);
      
      if (mergedWorkers.length === 0) {
        console.warn('⚠️ No workers found in localStorage. Please register workers first.');
      }
    } catch (error) {
      console.error('Error loading workers:', error);
      setAllWorkers([]);
    }
  };

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    navigate('/login');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedJob('');
    setSelectedLocation('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleSearch = () => {
    console.log('🔍 Starting search...');
    console.log('📊 All workers count:', allWorkers.length);
    console.log('🔎 Search query:', searchQuery);
    console.log('📌 Selected job:', selectedJob);
    console.log('📍 Selected location:', selectedLocation);
    
    setLoading(true);
    setShowResults(false);

    setTimeout(() => {
      let results = [...allWorkers];
      console.log('📋 Initial results:', results.length);
      
      // Search by query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        results = results.filter(worker => {
          const nameMatch = worker.fullName?.toLowerCase().includes(query);
          const skillMatch = worker.skills?.some(skill => skill.toLowerCase().includes(query));
          const jobMatch = worker.desiredJob?.toLowerCase().includes(query) || 
                          worker.jobTitle?.toLowerCase().includes(query);
          const bioMatch = worker.bio?.toLowerCase().includes(query);
          const locationMatch = worker.location?.toLowerCase().includes(query);
          const match = nameMatch || skillMatch || jobMatch || bioMatch || locationMatch;
          return match;
        });
        console.log('📊 After query filter:', results.length);
      }
      
      // Filter by job - using the shared job options
      if (selectedJob) {
        const jobLower = selectedJob.toLowerCase();
        // Find the job value that matches the selected label
        const matchedJob = JOB_OPTIONS.find(job => 
          job.label.toLowerCase() === jobLower || 
          job.value.toLowerCase() === jobLower
        );
        const jobValue = matchedJob ? matchedJob.value : selectedJob.toLowerCase().replace(/\s+/g, '_');
        
        results = results.filter(worker => {
          const match = worker.desiredJob?.toLowerCase() === jobValue ||
                       worker.desiredJob?.toLowerCase().includes(jobValue) ||
                       worker.jobTitle?.toLowerCase().includes(jobLower) ||
                       worker.position?.toLowerCase().includes(jobLower);
          return match;
        });
        console.log('📊 After job filter:', results.length);
      }
      
      // Filter by location
      if (selectedLocation) {
        const locLower = selectedLocation.toLowerCase();
        results = results.filter(worker => 
          worker.location?.toLowerCase().includes(locLower)
        );
        console.log('📊 After location filter:', results.length);
      }
      
      console.log('✅ Final results:', results.length);
      setSearchResults(results);
      setShowResults(true);
      setLoading(false);
    }, 500);
  };

  const handleHireNow = (worker) => {
    localStorage.setItem('homelyserv_selected_worker', JSON.stringify({
      workerId: worker.id || worker.email,
      workerName: worker.fullName,
      workerEmail: worker.email,
      hourlyRate: worker.hourlyRate,
      desiredJob: worker.desiredJob,
      commission: 15,
      employerId: user?.id || user?.email,
      employerName: user?.fullName,
      workerPhoto: worker.profileImage || '',
      workerSkills: worker.skills || [],
      workerExperience: worker.experience || '0 years',
      workerLocation: worker.location || 'Not specified'
    }));
    navigate('/employer-payments');
  };

  const handleViewProfile = (worker) => {
    localStorage.setItem('homelyserv_viewing_worker', JSON.stringify(worker));
    navigate('/worker-profile-view');
  };

  // Use the shared getJobLabel function
  const getJobLabelDisplay = (value) => {
    return getJobLabel(value);
  };

  // Get unique locations from workers
  const locationOptions = getUniqueLocations();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <EmployerSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative">
                <Bell size={20} className="text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full"></span>
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 md:p-8 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
                <p className="text-teal-100 mt-1">{t.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-teal-100">
                <Users size={18} />
                <span>{allWorkers.length} workers available</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-gray-600"
              >
                <Filter size={18} />
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

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.jobType}</label>
                  <select
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{t.selectJob}</option>
                    {jobLabels.map((job) => (
                      <option key={job} value={job}>{job}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.location}</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{t.selectLocation}</option>
                    {locationOptions.length > 0 ? (
                      locationOptions.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))
                    ) : (
                      <option value="" disabled>{t.noLocations}</option>
                    )}
                  </select>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-teal-600 transition"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          {showResults && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t.results}</h3>
                <span className="text-sm text-gray-500">
                  {searchResults.length} worker{searchResults.length !== 1 ? 's' : ''} found
                </span>
              </div>
              
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noResults}</h3>
                  <p className="text-gray-500">{t.tryAgain}</p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map((worker) => (
                    <div key={worker.id || worker.email} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start gap-4">
                        <img
                          src={worker.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.fullName)}&background=teal&color=fff&size=100&bold=true`}
                          alt={worker.fullName}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.fullName)}&background=teal&color=fff&size=100&bold=true`;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800">{worker.fullName}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Briefcase size={14} />
                            <span>{getJobLabelDisplay(worker.desiredJob)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin size={14} />
                            <span>{worker.location || 'Not specified'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <DollarSign size={14} />
                            <span>EGP {worker.hourlyRate}/hr</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <StarIcon size={14} className="text-yellow-500" />
                            <span>{worker.rating || 4.5} ★</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {worker.skills?.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                                {skill}
                              </span>
                            ))}
                            {worker.skills?.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
                                +{worker.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleHireNow(worker)}
                            className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition flex items-center gap-1 whitespace-nowrap"
                          >
                            <UserCheck size={16} />
                            {t.hire}
                          </button>
                          <button
                            onClick={() => handleViewProfile(worker)}
                            className="px-4 py-2 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition flex items-center gap-1 whitespace-nowrap"
                          >
                            <Eye size={16} />
                            {t.viewProfile}
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
      </main>
    </div>
  );
};

export default EmployerSearch;