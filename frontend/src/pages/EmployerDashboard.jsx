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
  Zap,
  Clock,
  Users,
  Heart,
  TrendingUp,
  Globe,
  X,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Search,
  UserPlus,
  Star,
  CreditCard
} from 'lucide-react';

// Employer Sidebar Component - Teal Theme
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
      payment: 'Payment',
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
      payment: 'الدفع',
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
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/payment' },
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

// Main EmployerDashboard Component
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    activeHires: 0,
    pendingApplications: 0,
    totalWorkers: 0,
    messages: 0,
    completedHires: 0,
    savedWorkers: 0
  });

  const translations = {
    en: {
      welcome: 'Welcome back',
      dashboard: 'Dashboard',
      overview: 'Overview',
      stats: {
        activeHires: 'Active Hires',
        pending: 'Pending Applications',
        totalWorkers: 'Total Workers',
        messages: 'Messages',
        completed: 'Completed Hires',
        saved: 'Saved Workers'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      findWorkers: 'Find Workers',
      viewHires: 'View Hires',
      viewProfile: 'View Profile',
      viewMessages: 'View Messages',
      notifications: 'Notifications',
      languageToggle: 'العربية',
      noActivity: 'No recent activity'
    },
    ar: {
      welcome: 'مرحباً بعودتك',
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      stats: {
        activeHires: 'التوظيفات النشطة',
        pending: 'الطلبات المعلقة',
        totalWorkers: 'إجمالي العمال',
        messages: 'الرسائل',
        completed: 'التوظيفات المكتملة',
        saved: 'العمال المحفوظين'
      },
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      findWorkers: 'البحث عن عمال',
      viewHires: 'عرض التوظيفات',
      viewProfile: 'عرض الملف الشخصي',
      viewMessages: 'عرض الرسائل',
      notifications: 'الإشعارات',
      languageToggle: 'English',
      noActivity: 'لا يوجد نشاط حديث'
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
        setUser(parsedUser);
        console.log('✅ User loaded in employer dashboard:', parsedUser.fullName);
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/login');
      }
    } else {
      console.log('❌ No user data found, redirecting to login');
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    const savedStats = localStorage.getItem('employer_stats');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (error) {
        console.error('Error parsing stats:', error);
      }
    }
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
      {/* Sidebar */}
      <EmployerSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={user}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
      } ml-0`}>
        {/* Top Header Bar */}
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
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.dashboard}</h2>
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

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {/* Welcome Section - Teal Theme */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">{t.welcome}, {user.fullName || 'Employer'}!</h1>
                <p className="text-teal-100 mt-1">{t.overview}</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/employer-search"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Search size={16} />
                  {t.findWorkers}
                </Link>
                <Link
                  to="/employer-profile"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <User size={16} />
                  {t.viewProfile}
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Grid - Teal Theme */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.activeHires}</p>
                <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Briefcase size={20} className="text-teal-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.activeHires}</p>
              <p className="text-xs text-gray-400 mt-1">Active contracts</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pending}</p>
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingApplications}</p>
              <p className="text-xs text-gray-400 mt-1">Pending applications</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.totalWorkers}</p>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalWorkers}</p>
              <p className="text-xs text-gray-400 mt-1">Available workers</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.messages}</p>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.messages}</p>
              <p className="text-xs text-gray-400 mt-1">Unread messages</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.completed}</p>
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completedHires}</p>
              <p className="text-xs text-gray-400 mt-1">Completed hires</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.saved}</p>
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Heart size={20} className="text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.savedWorkers}</p>
              <p className="text-xs text-gray-400 mt-1">Saved workers</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/employer-search"
                className="flex items-center gap-3 p-3 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
              >
                <Search size={20} className="text-teal-600" />
                <span className="font-medium text-teal-700">{t.findWorkers}</span>
              </Link>
              <Link
                to="/my-hires"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <FileCheck size={20} className="text-green-600" />
                <span className="font-medium text-green-700">{t.viewHires}</span>
              </Link>
              <Link
                to="/employer-profile"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
              >
                <User size={20} className="text-purple-600" />
                <span className="font-medium text-purple-700">{t.viewProfile}</span>
              </Link>
              <Link
                to="/employer-messages"
                className="flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              >
                <MessageCircle size={20} className="text-orange-600" />
                <span className="font-medium text-orange-700">{t.viewMessages}</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity - No fake data */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.recentActivity}</h3>
            <div className="text-center py-8 text-gray-500">
              <p>{t.noActivity}</p>
              <p className="text-sm mt-2">Start hiring workers to see activity here</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;