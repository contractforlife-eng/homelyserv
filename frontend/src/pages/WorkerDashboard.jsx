// src/pages/WorkerDashboard.jsx - RED AND WHITE THEME
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isUserPremium } from '../utils/subscriptionService';
import {
  Home,
  User,
  Briefcase,
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
  CreditCard,
  Shield,
  Sparkles,
  Crown
} from 'lucide-react';

// Sidebar Component - RED THEME
const WorkerSidebar = ({ 
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
      myOffers: 'My Offers',
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
      myOffers: 'عروضي',
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
    { id: 'dashboard', label: t.dashboard, icon: Home, path: '/worker-dashboard' },
    { id: 'profile', label: t.myProfile, icon: User, path: '/worker-profile' },
    { id: 'offers', label: t.myOffers, icon: Briefcase, path: '/worker/offers' },
    { id: 'messages', label: t.messages, icon: MessageCircle, path: '/worker-messages' },
    { id: 'complaints', label: t.complaints, icon: AlertTriangle, path: '/worker-complaints' },
    { id: 'payment', label: t.payment, icon: CreditCard, path: '/worker-payment' },
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
            <Link to="/worker-dashboard" className="flex items-center gap-2">
              <div className="relative">
                <Shield size={28} className="text-red-500" />
                <Home size={14} className="text-red-300 absolute -bottom-1 -right-1" />
              </div>
              <span className="font-bold text-gray-800 text-lg">HomelyServ</span>
            </Link>
          )}
          {sidebarCollapsed && (
            <Link to="/worker-dashboard" className="relative mx-auto">
              <Shield size={28} className="text-red-500" />
              <Home size={14} className="text-red-300 absolute -bottom-1 -right-1" />
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
              {getProfileImage() ? (
                <img 
                  src={getProfileImage()} 
                  alt={user?.fullName || 'Worker'} 
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
                  <p className="font-medium text-gray-800 truncate">{user.fullName || 'Worker'}</p>
                  {isPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 whitespace-nowrap">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{user.email || 'worker@homelyserv.com'}</p>
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
                  ? 'bg-red-50 text-red-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              } ${sidebarCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon size={20} className={isActive(item.path) ? 'text-red-600' : ''} />
              {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              )}
              {isActive(item.path) && !sidebarCollapsed && (
                <div className="ml-auto w-1.5 h-8 bg-red-600 rounded-full"></div>
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
            to="/worker-settings"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50 group ${
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

// Main WorkerDashboard Component - RED THEME
const WorkerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    totalApplications: 0,
    activeOffers: 0,
    interviews: 0,
    savedJobs: 0,
    profileViews: 0,
    messages: 0,
    completedJobs: 0,
    pendingPayments: 0,
    totalEarnings: 0,
    pendingOffers: 0,
    acceptedOffers: 0,
    inProgressOffers: 0,
    rejectedOffers: 0,
    completedOffers: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const isPremium = () => {
    const userId = user?.id || user?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const translations = {
    en: {
      welcome: 'Welcome back',
      dashboard: 'Dashboard',
      overview: 'Overview',
      stats: {
        applications: 'Applications',
        activeOffers: 'Active Offers',
        interviews: 'Interviews',
        savedJobs: 'Saved Jobs',
        profileViews: 'Profile Views',
        messages: 'Messages',
        completedJobs: 'Completed Jobs',
        pendingPayments: 'Pending Payments',
        totalEarnings: 'Total Earnings',
        pendingOffers: 'Pending Offers',
        acceptedOffers: 'Accepted',
        inProgress: 'In Progress',
        rejected: 'Rejected',
        completed: 'Completed'
      },
      recentActivity: 'Recent Activity',
      quickActions: 'Quick Actions',
      findJobs: 'Find Jobs',
      viewOffers: 'View Offers',
      viewProfile: 'View Profile',
      viewMessages: 'View Messages',
      notifications: 'Notifications',
      languageToggle: 'العربية',
      noActivity: 'No recent activity',
      noNotifications: 'No notifications',
      viewAll: 'View All',
      markAllRead: 'Mark All Read',
      premiumBadge: 'Premium Verified',
      getPremium: 'Get Premium'
    },
    ar: {
      welcome: 'مرحباً بعودتك',
      dashboard: 'لوحة التحكم',
      overview: 'نظرة عامة',
      stats: {
        applications: 'الطلبات',
        activeOffers: 'العروض النشطة',
        interviews: 'المقابلات',
        savedJobs: 'الوظائف المحفوظة',
        profileViews: 'مشاهدات الملف',
        messages: 'الرسائل',
        completedJobs: 'الوظائف المكتملة',
        pendingPayments: 'المدفوعات المعلقة',
        totalEarnings: 'إجمالي الأرباح',
        pendingOffers: 'عروض معلقة',
        acceptedOffers: 'مقبولة',
        inProgress: 'قيد التنفيذ',
        rejected: 'مرفوضة',
        completed: 'مكتملة'
      },
      recentActivity: 'النشاط الأخير',
      quickActions: 'إجراءات سريعة',
      findJobs: 'البحث عن وظائف',
      viewOffers: 'عرض العروض',
      viewProfile: 'عرض الملف الشخصي',
      viewMessages: 'عرض الرسائل',
      notifications: 'الإشعارات',
      languageToggle: 'English',
      noActivity: 'لا يوجد نشاط حديث',
      noNotifications: 'لا توجد إشعارات',
      viewAll: 'عرض الكل',
      markAllRead: 'تعيين الكل كمقروء',
      premiumBadge: 'مميز معتمد',
      getPremium: 'اشتراك مميز'
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

        const profiles = JSON.parse(
          localStorage.getItem('homelyserv_profiles') || '{}'
        );

        if (profiles[parsedUser.email]) {
          parsedUser.profileImage =
            profiles[parsedUser.email].profileImage || null;
        }

        setUser(parsedUser);
      } catch (error) {
        console.error(error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');

    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }
  }, [navigate]);

  // ============================================================
  // FIXED: Load stats only for the current worker
  // ============================================================
  const loadRealStats = () => {
    try {
      if (!user?.email) return;

      const currentUserEmail = user.email;
      const currentUserId = user.id || user.email;
      
      // Get all employer offers
      const employerOffers = JSON.parse(localStorage.getItem('employer_offers') || '[]');
      
      // FILTER: Only offers meant for this worker
      const workerOffers = employerOffers.filter(
        offer => offer.workerEmail === currentUserEmail
      );
      
      console.log(`📊 Worker ${currentUserEmail} has ${workerOffers.length} offers`);
      
      // Count offers by status
      const pendingOffers = workerOffers.filter(o => o.status === 'pending').length;
      const acceptedOffers = workerOffers.filter(o => o.status === 'accepted').length;
      const inProgressOffers = workerOffers.filter(o => o.status === 'in_progress').length;
      const rejectedOffers = workerOffers.filter(o => o.status === 'rejected').length;
      const completedOffers = workerOffers.filter(o => o.status === 'completed').length;
      
      // Also check worker-specific storage
      const workerSpecificOffers = JSON.parse(localStorage.getItem(`worker_offers_${currentUserEmail}`) || '[]');
      
      // Combine and deduplicate
      const allWorkerOffers = [...workerOffers];
      workerSpecificOffers.forEach(offer => {
        if (!allWorkerOffers.find(o => o.id === offer.id)) {
          allWorkerOffers.push(offer);
        }
      });
      
      // Recalculate with combined data
      const totalPending = allWorkerOffers.filter(o => o.status === 'pending').length;
      const totalAccepted = allWorkerOffers.filter(o => o.status === 'accepted').length;
      const totalInProgress = allWorkerOffers.filter(o => o.status === 'in_progress').length;
      const totalRejected = allWorkerOffers.filter(o => o.status === 'rejected').length;
      const totalCompleted = allWorkerOffers.filter(o => o.status === 'completed').length;
      
      // Get applied offers from worker_applied_offers
      const appliedOffers = JSON.parse(localStorage.getItem('worker_applied_offers') || '[]');
      // FILTER: Only applications by this worker
      const workerAppliedOffers = appliedOffers.filter(
        offer => offer.workerEmail === currentUserEmail || offer.workerId === currentUserId
      );
      
      // Get saved offers
      const savedOffers = JSON.parse(localStorage.getItem('worker_saved_offers') || '[]');
      // FILTER: Only saved offers by this worker
      const workerSavedOffers = savedOffers.filter(
        offer => offer.workerEmail === currentUserEmail || offer.workerId === currentUserId
      );
      
      // Calculate profile views (stored per worker)
      const profileViews = parseInt(localStorage.getItem(`profile_views_${currentUserEmail}`) || '0');
      
      // Calculate messages for this worker
      let messagesCount = 0;
      if (currentUserId) {
        const allMessages = JSON.parse(localStorage.getItem('homelyserv_chat_messages') || '{}');
        Object.keys(allMessages).forEach(convId => {
          const msgs = allMessages[convId] || [];
          msgs.forEach(msg => {
            if (msg.recipientId === currentUserId || msg.senderId === currentUserId) {
              messagesCount++;
            }
          });
        });
      }
      
      // Calculate payments for this worker
      const payments = JSON.parse(localStorage.getItem('homelyserv_payments') || '[]');
      const workerPayments = payments.filter(
        p => p.workerId === currentUserId || p.workerEmail === currentUserEmail
      );
      const pendingPayments = workerPayments.filter(p => p.status === 'pending').length;
      const totalEarnings = workerPayments
        .filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      
      // Set stats with filtered data
      setStats({
        totalApplications: workerAppliedOffers.length,
        activeOffers: allWorkerOffers.filter(o => o.status === 'active' || o.status === 'open').length,
        interviews: allWorkerOffers.filter(o => o.status === 'interview').length,
        savedJobs: workerSavedOffers.length,
        profileViews: profileViews,
        messages: messagesCount,
        completedJobs: totalCompleted,
        pendingPayments: pendingPayments,
        totalEarnings: totalEarnings,
        pendingOffers: totalPending,
        acceptedOffers: totalAccepted,
        inProgressOffers: totalInProgress,
        rejectedOffers: totalRejected,
        completedOffers: totalCompleted
      });
      
      console.log(`📊 Stats loaded for ${currentUserEmail}:`, {
        totalOffers: allWorkerOffers.length,
        pending: totalPending,
        accepted: totalAccepted,
        inProgress: totalInProgress,
        rejected: totalRejected,
        completed: totalCompleted,
        applications: workerAppliedOffers.length,
        earnings: totalEarnings
      });
      
      // Generate recent activity with filtered data
      generateRecentActivity(
        allWorkerOffers,
        workerAppliedOffers,
        workerSavedOffers,
        workerPayments,
        currentUserEmail
      );
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ============================================================
  // FIXED: Generate activity only for this worker
  // ============================================================
  const generateRecentActivity = (
    workerOffers,
    appliedOffers,
    savedOffers,
    payments,
    userEmail
  ) => {
    const activities = [];
    
    // Add offer activities
    workerOffers.forEach(offer => {
      let statusText = '';
      let icon = 'offer';
      
      switch (offer.status) {
        case 'pending':
          statusText = 'Pending Review';
          icon = 'clock';
          break;
        case 'accepted':
          statusText = 'Accepted';
          icon = 'check';
          break;
        case 'in_progress':
          statusText = 'In Progress';
          icon = 'zap';
          break;
        case 'completed':
          statusText = 'Completed';
          icon = 'check';
          break;
        case 'rejected':
          statusText = 'Rejected';
          icon = 'x';
          break;
        default:
          statusText = offer.status || 'Unknown';
      }
      
      activities.push({
        icon: icon,
        message: `${offer.jobTitle || 'Job offer'} from ${offer.employerName || 'employer'} - ${statusText}`,
        time: offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString() : 'Recently',
        status: statusText
      });
    });
    
    // Add payment activities
    payments.forEach(payment => {
      activities.push({
        icon: 'payment',
        message: `Payment of EGP ${payment.amount} ${payment.status === 'completed' ? 'received' : 'pending'}`,
        time: payment.date ? new Date(payment.date).toLocaleDateString() : 'Recently',
        status: payment.status === 'completed' ? 'Completed' : 'Pending'
      });
    });
    
    // Sort by time (most recent first)
    activities.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateB - dateA;
    });
    
    setRecentActivity(activities.slice(0, 10));
  };

  const loadNotifications = () => {
    try {
      if (!user?.email) return;
      
      const storedNotifications = JSON.parse(
        localStorage.getItem(`worker_notifications_${user.email}`) || '[]'
      );
      setNotifications(storedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (user) {
      loadRealStats();
      loadNotifications();
    }
  }, [user]);

  // Refresh stats periodically
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      loadRealStats();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = (id) => {
    const updated = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
    localStorage.setItem(`worker_notifications_${user.email}`, JSON.stringify(updated));
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem(`worker_notifications_${user.email}`, JSON.stringify(updated));
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

  if (user === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <WorkerSidebar
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
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="font-semibold text-gray-800">{t.notifications}</h4>
                      {notifications.length > 0 && (
                        <button 
                          onClick={markAllRead}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          {t.markAllRead}
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          {t.noNotifications}
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-red-50' : ''}`}
                            onClick={() => markNotificationRead(notification.id)}
                          >
                            <p className="text-sm text-gray-800">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                          </div>
                        ))
                      )}
                      {notifications.length > 5 && (
                        <div className="p-2 text-center">
                          <Link to="/notifications" className="text-sm text-red-600 hover:text-red-700 font-medium">
                            {t.viewAll}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 overflow-hidden border-2 border-red-200 relative">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={16} className="text-white m-1" />
                  )}
                  {userIsPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                      <Crown size={8} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user?.fullName || 'Worker'}
                  </span>
                  {userIsPremium && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 hidden sm:inline-flex">
                      <Crown size={10} className="text-yellow-500" />
                      Premium
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {t.languageToggle}
              </button>
              {!userIsPremium && (
                <Link
                  to="/subscription"
                  className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 border border-yellow-400/30"
                >
                  <Crown size={14} />
                  <span className="hidden sm:inline">{t.getPremium}</span>
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Welcome Banner - RED THEME */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {user?.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.fullName || 'Worker'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-white m-3" />
                  )}
                  {userIsPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t.welcome}, {user.fullName || 'Worker'}!</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t.premiumBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{t.overview}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/worker/offers"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <Briefcase size={16} />
                  {t.viewOffers}
                </Link>
                <Link
                  to="/worker-profile"
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
                >
                  <User size={16} />
                  {t.viewProfile}
                </Link>
                {!userIsPremium && (
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pendingOffers}</p>
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.acceptedOffers}</p>
                <CheckCircle size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.acceptedOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.inProgress}</p>
                <Zap size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.inProgressOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.completed}</p>
                <CheckCircle size={20} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completedOffers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.rejected}</p>
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.rejectedOffers}</p>
            </div>
          </div>

          {/* Stats Row 2 - Financial */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.totalEarnings}</p>
                <span className="text-red-500 font-bold">$</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">EGP {stats.totalEarnings}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.pendingPayments}</p>
                <CreditCard size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.completedJobs}</p>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.completedJobs}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">{t.stats.messages}</p>
                <MessageCircle size={20} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.messages}</p>
            </div>
          </div>

          {/* Quick Actions - RED THEME */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 group"
              >
                <Briefcase size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-blue-700">{t.findJobs}</span>
              </Link>
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200 group"
              >
                <Zap size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-green-700">{t.viewOffers}</span>
              </Link>
              <Link
                to="/worker-profile"
                className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 group"
              >
                <User size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-purple-700">{t.viewProfile}</span>
              </Link>
              <Link
                to="/worker-messages"
                className="flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 group"
              >
                <MessageCircle size={20} className="text-red-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-red-700">{t.viewMessages}</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.recentActivity}</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>{t.noActivity}</p>
                <p className="text-sm mt-2">Start applying for jobs to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.icon === 'offer' || activity.icon === 'zap' ? 'bg-blue-100' :
                      activity.icon === 'check' ? 'bg-green-100' :
                      activity.icon === 'clock' ? 'bg-yellow-100' :
                      activity.icon === 'x' ? 'bg-red-100' :
                      activity.icon === 'payment' ? 'bg-purple-100' :
                      'bg-gray-100'
                    }`}>
                      {activity.icon === 'offer' && <Briefcase size={16} className="text-blue-600" />}
                      {activity.icon === 'zap' && <Zap size={16} className="text-green-600" />}
                      {activity.icon === 'check' && <CheckCircle size={16} className="text-green-600" />}
                      {activity.icon === 'clock' && <Clock size={16} className="text-yellow-600" />}
                      {activity.icon === 'x' && <X size={16} className="text-red-600" />}
                      {activity.icon === 'payment' && <CreditCard size={16} className="text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'Completed' || activity.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        activity.status === 'Pending' || activity.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Rejected' ? 'bg-red-100 text-red-700' :
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

export default WorkerDashboard;