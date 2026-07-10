// src/pages/EmployerSearch.jsx - COMPLETE FIXED VERSION
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
  Shield,
  Award,
  Zap,
  Heart,
  UserPlus,
  BarChart3,
  SlidersHorizontal,
  ArrowUpDown,
  ThumbsUp,
  LayoutGrid,
  List
} from 'lucide-react';

// Employer Sidebar Component
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
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.fullName || 'Employer'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-teal-600" />
              )}
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

// Main EmployerSearch Component
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
  const [savedWorkers, setSavedWorkers] = useState([]);
  
  // Advanced Filters
  const [advancedFilters, setAdvancedFilters] = useState({
    minRating: 0,
    minExperience: 0,
    availability: 'all',
    maxHourlyRate: 100,
    language: 'all'
  });

  // Sort Options
  const [sortBy, setSortBy] = useState('relevance');

  // View Mode
  const [viewMode, setViewMode] = useState('grid');

  const jobOptions = [
    'All Jobs',
    'Nanny',
    'Baby Sitter',
    'Elderly Caregiver',
    'Driver',
    'Cook',
    'House Manager',
    'Gardener',
    'Nurse',
    'Tutor',
    'Housekeeper',
    'Personal Assistant',
    'Cleaner',
    'Security Guard',
    'Maintenance Worker',
    'Teacher'
  ];

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
      advancedFilters: 'Advanced Filters',
      minRating: 'Minimum Rating',
      minExperience: 'Minimum Experience',
      availability: 'Availability',
      available: 'Available',
      unavailable: 'Unavailable',
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
      quickHire: 'Quick Hire',
      saved: 'Saved',
      experienceYears: 'years experience'
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
      advancedFilters: 'فلاتر متقدمة',
      minRating: 'الحد الأدنى للتقييم',
      minExperience: 'الحد الأدنى للخبرة',
      availability: 'التوفر',
      available: 'متاح',
      unavailable: 'غير متاح',
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
      quickHire: 'توظيف سريع',
      saved: 'محفوظ',
      experienceYears: 'سنوات الخبرة'
    }
  };

  const t = translations[language];

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

    const saved = localStorage.getItem('employer_saved_workers');
    if (saved) {
      setSavedWorkers(JSON.parse(saved));
    }

    loadWorkersFromStorage();
  }, [navigate]);

  const loadWorkersFromStorage = () => {
    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const workers = users.filter(user => user.role === 'WORKER');
      const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
      
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
          experience: parseInt(profile.experience) || parseInt(worker.experience) || 0,
          hourlyRate: parseInt(profile.hourlyRate) || parseInt(worker.hourlyRate) || 30,
          desiredJob: profile.desiredJob || worker.desiredJob || '',
          profileImage: profile.profileImage || worker.profileImage || '',
          rating: profile.rating || worker.rating || 4.5,
          jobsCompleted: profile.jobsCompleted || worker.jobsCompleted || 0,
          available: profile.available !== undefined ? profile.available : true,
          role: 'WORKER',
          languages: profile.languages || worker.languages || ['english']
        };
      });
      
      setAllWorkers(mergedWorkers);
      console.log(`✅ Loaded ${mergedWorkers.length} workers from localStorage`);
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

  const handleQuickHire = (worker) => {
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

  const handleSearch = () => {
    console.log('🔍 Starting search...');
    setLoading(true);
    setShowResults(false);

    setTimeout(() => {
      let results = [...allWorkers];
      
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
      }
      
      if (selectedJob && selectedJob !== 'All Jobs') {
        const jobLower = selectedJob.toLowerCase();
        results = results.filter(worker => {
          const match = worker.desiredJob?.toLowerCase().includes(jobLower) ||
                       worker.jobTitle?.toLowerCase().includes(jobLower) ||
                       worker.position?.toLowerCase().includes(jobLower);
          return match;
        });
      }
      
      if (selectedLocation && selectedLocation !== 'All Locations') {
        const locLower = selectedLocation.toLowerCase();
        results = results.filter(worker => 
          worker.location?.toLowerCase().includes(locLower)
        );
      }

      // Advanced Filters
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

      // Sort Options
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

  const getJobLabel = (value) => {
    const jobMap = {
      'nanny': 'Nanny',
      'elderly_care': 'Elderly Caregiver',
      'housekeeper': 'Housekeeper',
      'cook': 'Cook',
      'driver': 'Driver',
      'gardener': 'Gardener',
      'house_manager': 'House Manager',
      'tutor': 'Tutor',
      'pet_care': 'Pet Care',
      'maintenance': 'Maintenance',
      'security': 'Security Guard',
      'personal_assistant': 'Personal Assistant',
      'event_planner': 'Event Planner',
      'fitness_trainer': 'Fitness Trainer',
      'nurse': 'Nurse',
      'therapist': 'Therapist',
      'cleaner': 'Cleaner',
      'other': 'Other'
    };
    return jobMap[value] || value || 'Not specified';
  };

  const getUniqueLocations = () => {
    const locations = allWorkers
      .map(worker => worker.location)
      .filter(location => location && location !== 'Not specified' && location !== '')
      .filter((value, index, self) => self.indexOf(value) === index);
    return ['All Locations', ...locations.sort()];
  };

  const locationOptionsDynamic = getUniqueLocations();

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
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : viewMode === 'list' ? 'compact' : 'grid')}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {viewMode === 'grid' && <LayoutGrid size={16} />}
                {viewMode === 'list' && <List size={16} />}
                {viewMode === 'compact' && <BarChart3 size={16} />}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
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
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.jobType}</label>
                    <select
                      value={selectedJob}
                      onChange={(e) => setSelectedJob(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    >
                      {jobOptions.map((job) => (
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
                      {locationOptionsDynamic.map((loc) => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{t.advancedFilters}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.minRating}</label>
                      <select
                        value={advancedFilters.minRating}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minRating: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                      >
                        {ratingOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.minExperience}</label>
                      <select
                        value={advancedFilters.minExperience}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minExperience: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                      >
                        {experienceLevels.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.availability}</label>
                      <select
                        value={advancedFilters.availability}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, availability: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                      >
                        <option value="all">{t.filters.all}</option>
                        <option value="available">{t.available}</option>
                        <option value="unavailable">{t.unavailable}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.maxHourlyRate}</label>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={advancedFilters.maxHourlyRate}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxHourlyRate: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>10</span>
                        <span className="font-medium text-teal-600">{advancedFilters.maxHourlyRate} EGP</span>
                        <span>100</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.language}</label>
                      <select
                        value={advancedFilters.language}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
                      >
                        {languageOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t.sortBy}</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-sm"
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
                    className="px-4 py-2 text-sm text-gray-600 hover:text-teal-600 transition"
                  >
                    {t.clearFilters}
                  </button>
                </div>
              </div>
            )}
          </div>

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
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  : viewMode === 'list' 
                  ? 'space-y-4'
                  : 'grid grid-cols-1 md:grid-cols-3 gap-3'
                }>
                  {searchResults.map((worker) => (
                    <div 
                      key={worker.id || worker.email} 
                      className={`border border-gray-200 rounded-lg p-4 hover:shadow-md transition ${
                        viewMode === 'compact' ? 'p-3' : ''
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
                              <h4 className={`font-semibold text-gray-800 ${viewMode === 'compact' ? 'text-sm' : ''}`}>
                                {worker.fullName}
                              </h4>
                              <button
                                onClick={() => toggleSaveWorker(worker.id || worker.email)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Heart 
                                  size={viewMode === 'compact' ? 14 : 18} 
                                  className={savedWorkers.includes(worker.id || worker.email) ? 'fill-red-500 text-red-500' : 'text-gray-400'} 
                                />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Briefcase size={viewMode === 'compact' ? 12 : 14} />
                              <span>{getJobLabel(worker.desiredJob)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <MapPin size={viewMode === 'compact' ? 12 : 14} />
                              <span className="truncate">{worker.location || 'Not specified'}</span>
                            </div>
                            {viewMode !== 'compact' && (
                              <>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <DollarSign size={14} />
                                  <span>EGP {worker.hourlyRate}/hr</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <StarIcon size={14} className="text-yellow-500" />
                                  <span>{worker.rating || 4.5} ★</span>
                                  <span className="text-gray-400">•</span>
                                  <span>{worker.experience || 0} {t.experienceYears}</span>
                                </div>
                              </>
                            )}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {worker.skills?.slice(0, viewMode === 'compact' ? 2 : 3).map((skill, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {worker.skills?.length > (viewMode === 'compact' ? 2 : 3) && (
                                <span className="px-2 py-0.5 bg-gray-50 text-gray-500 text-xs rounded-full">
                                  +{worker.skills.length - (viewMode === 'compact' ? 2 : 3)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`flex gap-2 ${viewMode === 'list' ? 'flex-wrap items-center' : ''}`}>
                          <button
                            onClick={() => handleQuickHire(worker)}
                            className="flex-1 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition flex items-center justify-center gap-1"
                          >
                            <Zap size={14} />
                            {t.quickHire}
                          </button>
                          <button
                            onClick={() => handleViewProfile(worker)}
                            className="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-1"
                          >
                            <Eye size={14} />
                            {viewMode === 'compact' ? '' : t.viewProfile}
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