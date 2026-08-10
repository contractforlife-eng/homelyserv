// src/pages/EmployerDashboard.jsx - WITH WORKING NOTIFICATION BELL (NO TEST NOTIFICATIONS)
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import hireService from '../services/hireService';
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

// ============================================================
// MAIN EMPLOYER DASHBOARD - WITH WORKING NOTIFICATION BELL
// ============================================================
const EmployerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  
  const dashboard = useDashboard();
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
  // Track whether initial load has completed to distinguish initial fetch from background polling
  const hasLoadedRef = useRef(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const userIsPremium = () => {
    const userId = authUser?.id || authUser?.email;
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
      premiumBadge: 'Premium',
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
      premiumBadge: 'مميز',
      getPremium: 'اشتراك مميز'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  // ============================================================
  // LOAD REAL DATA
  // ============================================================
  const loadDashboardData = async () => {
    if (!authUser) return;

    // Only set loading on initial fetch, NOT on polling/background refresh
    const isInitial = !hasLoadedRef.current;
    if (isInitial) {
      setLoading(true);
      setIsInitialLoading(true);
    }
    
    try {
      const employerId = authUser.id || authUser.email;
      const employerEmail = authUser.email;
      
      console.log('📊 Loading dashboard data for employer:', employerId);

      // 1. Get hires from API
      let allHires = [];
      let employerOffers = [];
      try {
        const data = await hireService.getOffers();
        allHires = data.hires || data.offers || data || [];
      } catch (error) {
        console.error('Error loading hires:', error);
      }
      try {
        const data = await hireService.getOffers();
        employerOffers = data.offers || data || [];
      } catch (error) {
        console.error('Error loading offers:', error);
      }

      const employerHires = allHires.filter(
        hire => hire.employerId === employerId || hire.employerEmail === employerEmail
      );
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
        unreadMessages = await getTotalUnreadCount(employerId);
      } catch (error) {
        console.error('Error getting unread messages:', error);
      }

      // 5. Get total workers - removed localStorage dependency
      // Note: totalWorkers stat requires a backend endpoint to count all workers
      // Setting to 0 until backend endpoint is available
      const totalWorkers = 0;

      // 6. Get saved workers - removed localStorage dependency
      // Note: savedWorkers stat requires a backend endpoint
      // Setting to 0 until backend endpoint is available
      const savedWorkerIds = [];

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
      hasLoadedRef.current = true;
      setLoading(false);
      setIsInitialLoading(false);
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

  // Load data when user is authenticated
  useEffect(() => {
    if (authUser) {
      loadDashboardData();
    }
  }, [authUser]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    if (!authUser) return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [authUser]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  // ============================================================
  // RENDER
  // ============================================================
  // Show full-page loader ONLY during initial auth check when no user data exists
  // After auth is resolved, render the layout shell immediately
  if (authLoading && !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t.dashboard}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isPremium}
      />

        <div className="p-4 md:p-6">
          {showSuccessBanner && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/30 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2 animate-slideDown">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-green-800 dark:text-green-300">{t.paymentSuccess}</p>
                  <p className="text-sm text-green-700 dark:text-green-400 break-words">{successMessage}</p>
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
                  {isPremium && (
                    <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-400 rounded-full p-0.5 border-2 border-white/50">
                      <Crown size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{t.welcome}, {authUser.fullName || 'Employer'}!</h1>
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
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/employer-search"
                  className="bg-white text-teal-700 dark:bg-gray-800/20 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Search size={16} />
                  {t.findWorkers}
                </Link>
                <Link
                  to="/employer-profile"
                  className="bg-white text-teal-700 dark:bg-gray-800/20 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
            {isInitialLoading ? (
              /* Skeleton placeholders while initial data loads - no fake numbers */
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 animate-pulse">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                  <div className="h-7 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))
            ) : (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.activeHires}</p>
                    <div className="w-10 h-10 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                      <Briefcase size={20} className="text-teal-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.activeHires}</p>
                  <p className="text-xs text-gray-400 mt-1">Active contracts</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.total}</p>
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Users size={20} className="text-blue-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalHires}</p>
                  <p className="text-xs text-gray-400 mt-1">Total hires</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.completed}</p>
                    <div className="w-10 h-10 bg-green-50 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.completedHires}</p>
                  <p className="text-xs text-gray-400 mt-1">Completed hires</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.pending}</p>
                    <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                      <Clock size={20} className="text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pendingApplications}</p>
                  <p className="text-xs text-gray-400 mt-1">Pending applications</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.messages}</p>
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                      <MessageCircle size={20} className="text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.unreadMessages}</p>
                  <p className="text-xs text-gray-400 mt-1">Unread messages</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.saved}</p>
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Heart size={20} className="text-purple-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.savedWorkers}</p>
                  <p className="text-xs text-gray-400 mt-1">Saved workers</p>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white dark:text-white mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/employer-search"
                className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-900/30 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
              >
                <Search size={20} className="text-teal-600" />
                <span className="font-medium text-teal-700">{t.findWorkers}</span>
              </Link>
              <Link                to="/my-hires"
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <FileCheck size={20} className="text-green-600" />
                <span className="font-medium text-green-700">{t.viewHires}</span>
              </Link>
              <Link
                to="/employer-profile"
                className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
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
          <div className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white dark:text-white mb-4">{t.recentActivity}</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <p>{t.noActivity}</p>
                <p className="text-sm mt-2">Start hiring workers to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center">
                      {activity.icon === 'hire' && <UserPlus size={16} className="text-teal-600" />}
                      {activity.icon === 'offer' && <Briefcase size={16} className="text-blue-600" />}
                      {activity.icon === 'message' && <MessageCircle size={16} className="text-orange-600" />}
                      {!activity.icon && <Briefcase size={16} className="text-teal-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white dark:text-gray-200">{activity.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' :
                        activity.status === 'Completed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400' :
                        activity.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:text-gray-300'
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
      </DashboardLayout>
    );
  };

export default EmployerDashboard;
