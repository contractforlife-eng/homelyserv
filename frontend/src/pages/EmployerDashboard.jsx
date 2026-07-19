// src/pages/EmployerDashboard.jsx - WITH WORKING NOTIFICATION BELL (NO TEST NOTIFICATIONS)
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import NotificationBell from '../components/NotificationBell';
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
  CreditCard,
  Crown
} from 'lucide-react';
import {
  getUserConversations,
  getTotalUnreadCount
} from '../utils/chatService';

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
      payment: 'Payment',
      settings: 'Settings',
      help: 'Help & Support',
      logout: 'Logout',
      overview: 'Overview',
      premium: 'Premium'
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
      overview: 'نظرة عامة',
      premium: 'مميز'
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
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/employer-payments' },
    { id: 'premium', label: t.premium, icon: Crown, path: '/subscription' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getProfileImage = () => {
    if (user?.profileImage) {
      return user.profileImage;
    }
    return null;
  };

  const userIsPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const isPremium = userIsPremium();

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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Employer'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User size={20} className="text-white" />
              )}
              {isPremium && (
                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                  <Crown size={10} className="text-white" />
                </div>
              )}
            </div>
            {!sidebarCollapsed && user && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Employer'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
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
              {item.id === 'premium' && !isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto">
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded-full font-medium">NEW</span>
                </div>
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

// ============================================================
// MAIN EMPLOYER DASHBOARD - WITH WORKING NOTIFICATION BELL
// ============================================================
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeHires: 0,
    pendingApplications: 0,
    totalWorkers: 0,
    unreadMessages: 0,
    completedHires: 0,
    savedWorkers: 0,
    totalHires: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  const userIsPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const isPremium = userIsPremium();

  const translations = {
    en: {
      welcome: 'Welcome back',
      dashboard: 'Dashboard',
      overview: 'Overview',
      stats: {
        activeHires: 'Active Hires',
        pending: 'Pending Applications',
        totalWorkers: 'Total Workers',
        messages: 'Unread Messages',
        completed: 'Completed Hires',
        saved: 'Saved Workers',
        total: 'Total Hires'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      findWorkers: 'Find Workers',
      viewHires: 'View Hires',
      viewProfile: 'View Profile',
      viewMessages: 'View Messages',
      notifications: 'Notifications',
      languageToggle: 'العربية',
      noActivity: 'No recent activity',
      paymentSuccess: '🎉 Payment Successful!',
      hiredSuccess: 'Successfully hired {worker}!',
      viewHireDetails: 'View Hire Details',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium'
    },
    ar: {
      welcome: 'مرحباً بعودتك',
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      stats: {
        activeHires: 'التوظيفات النشطة',
        pending: 'الطلبات المعلقة',
        totalWorkers: 'إجمالي العمال',
        messages: 'الرسائل غير المقروءة',
        completed: 'التوظيفات المكتملة',
        saved: 'العمال المحفوظين',
        total: 'إجمالي التوظيفات'
      },
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      findWorkers: 'البحث عن عمال',
      viewHires: 'عرض التوظيفات',
      viewProfile: 'عرض الملف الشخصي',
      viewMessages: 'عرض الرسائل',
      notifications: 'الإشعارات',
      languageToggle: 'English',
      noActivity: 'لا يوجد نشاط حديث',
      paymentSuccess: '🎉 تم الدفع بنجاح!',
      hiredSuccess: 'تم توظيف {worker} بنجاح!',
      viewHireDetails: 'عرض تفاصيل التوظيف',
      premiumBadge: 'مميز معتمد',
      getPremium: 'اشتراك مميز'
    }
  };

  const t = translations[language];

  // ============================================================
  // LOAD REAL DATA
  // ============================================================
  const loadDashboardData = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const employerId = user.id || user.email;
      const employerEmail = user.email;
      
      console.log('📊 Loading dashboard data for employer:', employerId);

      // 1. Get hires from localStorage
      const allHires = JSON.parse(localStorage.getItem('homelyserv_hires') || '[]');
      const employerHires = allHires.filter(
        hire => hire.employerId === employerId || hire.employerEmail === employerEmail
      );
      
      // Also check employer_offers for hired status
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      const hiredOffers = employerOffers.filter(
        offer => (offer.status === 'hired' || offer.status === 'accepted' || offer.status === 'active') &&
                 (offer.employerId === employerId || offer.employerEmail === employerEmail)
      );
      
      // Merge hires from both sources
      const existingWorkerIds = new Set(employerHires.map(h => h.workerId || h.workerEmail));
      hiredOffers.forEach(offer => {
        const workerId = offer.workerId || offer.workerEmail;
        if (!existingWorkerIds.has(workerId)) {
          employerHires.push({
            id: offer.hireId || offer.id,
            workerId: workerId,
            workerName: offer.workerName || 'Worker',
            status: offer.status === 'hired' ? 'active' : offer.status,
            startDate: offer.hiredAt || offer.createdAt,
            salary: offer.amount || 0,
            jobTitle: offer.jobTitle || 'Service Provider'
          });
        }
      });

      // 2. Calculate hire stats
      const activeHires = employerHires.filter(h => h.status === 'active' || h.status === 'accepted' || h.status === 'hired').length;
      const completedHires = employerHires.filter(h => h.status === 'completed').length;
      const totalHires = employerHires.length;

      // 3. Get pending applications from offers
      const pendingApplications = employerOffers.filter(
        o => (o.status === 'pending' || o.status === 'new' || o.status === 'applied') &&
             (o.employerId === employerId || o.employerEmail === employerEmail)
      ).length;

      // 4. Get unread messages from chat service
      let unreadMessages = 0;
      try {
        const conversations = await getUserConversations(employerId);
        unreadMessages = conversations.reduce((total, conv) => total + (conv.unread || 0), 0);
      } catch (error) {
        console.error('Error getting unread messages:', error);
        // Fallback to localStorage
        const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
        Object.keys(allMessages).forEach(convId => {
          const msgs = allMessages[convId] || [];
          msgs.forEach(msg => {
            if (msg.recipientId === employerId && !msg.read) {
              unreadMessages++;
            }
          });
        });
      }

      // 5. Get total workers (from users)
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      const totalWorkers = users.filter(u => u.role === 'WORKER').length;

      // 6. Get saved workers
      const savedWorkers = JSON.parse(localStorage.getItem('employer_saved_workers') || '[]');
      const savedWorkerIds = savedWorkers.filter(w => w.employerId === employerId || w.employerEmail === employerEmail);

      // 7. Generate recent activity
      const activities = [];
      
      // Add recent hires
      employerHires.slice(0, 3).forEach(hire => {
        if (hire.workerName) {
          activities.push({
            icon: 'hire',
            message: `Hired ${hire.workerName}`,
            time: hire.startDate ? new Date(hire.startDate).toLocaleDateString() : 'Recently',
            status: hire.status === 'active' ? 'Active' : hire.status === 'completed' ? 'Completed' : 'Pending'
          });
        }
      });

      // Add recent offers
      employerOffers.slice(0, 3).forEach(offer => {
        if (offer.status === 'pending' || offer.status === 'new') {
          activities.push({
            icon: 'offer',
            message: `Posted job: ${offer.jobTitle || 'Job Offer'}`,
            time: offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : 'Recently',
            status: 'Pending'
          });
        }
      });

      // Sort activities by time (most recent first)
      activities.sort((a, b) => {
        const dateA = new Date(a.time);
        const dateB = new Date(b.time);
        return dateB - dateA;
      });

      setStats({
        activeHires,
        pendingApplications,
        totalWorkers,
        unreadMessages,
        completedHires,
        savedWorkers: savedWorkerIds.length,
        totalHires
      });

      setRecentActivity(activities.slice(0, 10));
      
      console.log('✅ Dashboard data loaded:', { activeHires, totalHires, unreadMessages, pendingApplications });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USE EFFECTS
  // ============================================================
  useEffect(() => {
    // Check for payment success from navigation state
    if (location.state?.paymentSuccess) {
      const workerName = location.state.worker || 'worker';
      const message = t.hiredSuccess.replace('{worker}', workerName);
      setSuccessMessage(message);
      setShowSuccessBanner(true);
      
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
      }, 8000);
      
      navigate('/employer-dashboard', { replace: true, state: {} });
      
      return () => clearTimeout(timer);
    }
  }, [location.state, navigate, t]);

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
  }, [navigate]);

  // Load data when user is set
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // ============================================================
  // HANDLERS
  // ============================================================
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

  // ============================================================
  // RENDER
  // ============================================================
  if (!user || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
                <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">{t.dashboard}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 overflow-hidden border-2 border-teal-200 relative">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Employer'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-teal-600 m-1" />
                  )}
                  {isPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                      <Crown size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user?.fullName || 'Employer'}
                  </span>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 hidden sm:inline-flex">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
              </div>
              
              {/* WORKING NOTIFICATION BELL */}
              <NotificationBell userId={user?.id || user?.email} />
              
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
          {showSuccessBanner && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between animate-slideDown">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-green-800">{t.paymentSuccess}</p>
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/my-hires"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  {t.viewHireDetails}
                </Link>
                <button
                  onClick={() => setShowSuccessBanner(false)}
                  className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-green-600" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Employer'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={24} className="text-white m-3" />
                  )}
                  {isPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t.welcome}, {user.fullName || 'Employer'}!</h1>
                    {isPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t.premiumBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-teal-100 mt-1">{t.overview}</p>
                </div>
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
                {!isPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-yellow-400/30"
                  >
                    <Crown size={16} />
                    {t.getPremium}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Cards - REAL DATA */}
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
                <p className="text-sm text-gray-500">{t.stats.total}</p>
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalHires}</p>
              <p className="text-xs text-gray-400 mt-1">Total hires</p>
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
                <p className="text-sm text-gray-500">{t.stats.messages}</p>
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <MessageCircle size={20} className="text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.unreadMessages}</p>
              <p className="text-xs text-gray-400 mt-1">Unread messages</p>
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

          {/* Recent Activity - REAL DATA */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.recentActivity}</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>{t.noActivity}</p>
                <p className="text-sm mt-2">Start hiring workers to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                      {activity.icon === 'hire' && <UserPlus size={16} className="text-teal-600" />}
                      {activity.icon === 'offer' && <Briefcase size={16} className="text-blue-600" />}
                      {activity.icon === 'message' && <MessageCircle size={16} className="text-orange-600" />}
                      {!activity.icon && <Briefcase size={16} className="text-teal-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'Active' ? 'bg-green-100 text-green-700' :
                        activity.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {activity.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;