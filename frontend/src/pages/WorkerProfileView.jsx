// src/pages/WorkerProfileView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  DollarSign,
  Star,
  Mail,
  Phone,
  Calendar,
  Clock,
  CheckCircle,
  Award,
  MessageCircle,
  UserCheck,
  Globe,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  X,
  FileCheck,
  Search,
  AlertTriangle,
  Home
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

// Main WorkerProfileView Component
const WorkerProfileView = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);

  const translations = {
    en: {
      title: 'Worker Profile',
      back: 'Back to Search',
      contact: 'Contact Worker',
      hire: 'Hire Now',
      about: 'About',
      skills: 'Skills',
      experience: 'Experience',
      location: 'Location',
      hourlyRate: 'Hourly Rate',
      rating: 'Rating',
      jobsCompleted: 'Jobs Completed',
      memberSince: 'Member Since',
      availability: 'Availability',
      available: 'Available',
      notAvailable: 'Not Available',
      languages: 'Languages',
      contactInfo: 'Contact Information',
      email: 'Email',
      phone: 'Phone',
      noBio: 'No bio provided',
      noSkills: 'No skills listed',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      loading: 'Loading worker profile...',
      noWorkerData: 'No worker data found'
    },
    ar: {
      title: 'الملف الشخصي للعامل',
      back: 'العودة إلى البحث',
      contact: 'تواصل مع العامل',
      hire: 'توظيف الآن',
      about: 'عن',
      skills: 'المهارات',
      experience: 'الخبرة',
      location: 'الموقع',
      hourlyRate: 'السعر بالساعة',
      rating: 'التقييم',
      jobsCompleted: 'الوظائف المكتملة',
      memberSince: 'عضو منذ',
      availability: 'التوفر',
      available: 'متاح',
      notAvailable: 'غير متاح',
      languages: 'اللغات',
      contactInfo: 'معلومات الاتصال',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      noBio: 'لا توجد سيرة ذاتية',
      noSkills: 'لا توجد مهارات',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      loading: 'جاري تحميل الملف الشخصي...',
      noWorkerData: 'لا توجد بيانات للعامل'
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
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    // Load worker data from localStorage
    const workerData = localStorage.getItem('homelyserv_viewing_worker');
    if (workerData) {
      try {
        setWorker(JSON.parse(workerData));
      } catch (error) {
        console.error('Error parsing worker data:', error);
        navigate('/employer-search');
      }
    } else {
      navigate('/employer-search');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
    
    setLoading(false);
  }, [navigate]);

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

  const handleBack = () => {
    navigate('/employer-search');
  };

  const handleHireNow = () => {
    if (worker) {
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
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

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

  if (!worker) {
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
          <div className="p-4 md:p-6">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{t.noWorkerData}</h3>
              <button
                onClick={handleBack}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t.back}
              </button>
            </div>
          </div>
        </main>
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
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition mb-4"
          >
            <ArrowLeft size={18} />
            {t.back}
          </button>

          {/* Profile Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                {worker?.profileImage ? (
                  <img 
                    src={worker.profileImage} 
                    alt={worker.fullName} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={48} className="text-white" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold">{worker.fullName}</h1>
                <p className="text-teal-100">{getJobLabel(worker.desiredJob)}</p>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-teal-100">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {worker.location || 'Not specified'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-400" />
                    {worker.rating || '4.5'} ★
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={16} />
                    {worker.jobsCompleted || 0} jobs completed
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleHireNow}
                  className="px-6 py-2 bg-white text-teal-700 rounded-lg font-medium hover:bg-teal-50 transition flex items-center gap-2"
                >
                  <UserCheck size={18} />
                  {t.hire}
                </button>
                <button
                  className="px-6 py-2 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition flex items-center gap-2"
                >
                  <MessageCircle size={18} />
                  {t.contact}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - About & Skills */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.about}</h3>
                <p className="text-gray-600">
                  {worker.bio || t.noBio}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">{t.skills}</h3>
                {worker.skills && worker.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {worker.skills.map((skill, idx) => (
                      <span key={idx} className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">{t.noSkills}</p>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.experience}</span>
                    <span className="font-medium">{worker.experience || '0 years'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.hourlyRate}</span>
                    <span className="font-medium text-teal-600">EGP {worker.hourlyRate}/hr</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.availability}</span>
                    <span className="font-medium text-green-600">{t.available}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t.memberSince}</span>
                    <span className="font-medium">June 2025</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.contactInfo}</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600">{worker.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-600">{worker.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerProfileView;