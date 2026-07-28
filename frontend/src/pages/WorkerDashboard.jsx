// src/pages/WorkerDashboard.jsx - RED AND WHITE THEME WITH ENHANCED NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../components/layout/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  getUserConversations,
  getTotalUnreadCount
} from '../utils/chatService';
import hireService from '../services/hireService';
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
  Crown,
  ThumbsUp,
  AlertCircle,
  Star,
  FileText,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react';

const WorkerDashboard = () => {
  
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
   
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

  const dashboard = useDashboard();

  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
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

  const t = translations[dashboard.language] || translations.en;

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  // ============================================================
  // LOAD STATS
  // ============================================================
  const loadRealStats = async () => {
    try {
      if (!authUser?.email) return;

       const currentUserEmail = authUser.email;
       const currentUserId = authUser.id || authUser.email;

       let allWorkerOffers = [];
       try {
         const offersData = await hireService.getOffers();
         allWorkerOffers = Array.isArray(offersData) ? offersData : [];
       } catch (error) {
         console.error('Error loading offers:', error);
       }

      const pendingOffers = allWorkerOffers.filter(o => o.status === 'pending').length;
      const acceptedOffers = allWorkerOffers.filter(o => o.status === 'accepted').length;
      const inProgressOffers = allWorkerOffers.filter(o => o.status === 'in_progress').length;
      const rejectedOffers = allWorkerOffers.filter(o => o.status === 'rejected').length;
      const completedOffers = allWorkerOffers.filter(o => o.status === 'completed').length;

      const appliedOffers = [];
      const savedOffers = [];
      const profileViews = 0;

      let messagesCount = 0;
      if (currentUserId) {
        try {
          messagesCount = await getTotalUnreadCount(currentUserId);
        } catch (error) {
          console.error('Error getting message count:', error);
        }
      }

      const workerPayments = [];
      const pendingPayments = 0;
      const totalEarnings = 0;

      setStats({
        totalApplications: appliedOffers.length,
        activeOffers: allWorkerOffers.filter(o => o.status === 'active' || o.status === 'open').length,
        interviews: allWorkerOffers.filter(o => o.status === 'interview').length,
        savedJobs: savedOffers.length,
        profileViews: profileViews,
        messages: messagesCount,
        completedJobs: completedOffers,
        pendingPayments: pendingPayments,
        totalEarnings: totalEarnings,
        pendingOffers: pendingOffers,
        acceptedOffers: acceptedOffers,
        inProgressOffers: inProgressOffers,
        rejectedOffers: rejectedOffers,
        completedOffers: completedOffers
      });

      generateRecentActivity(
        allWorkerOffers,
        appliedOffers,
        savedOffers,
        workerPayments,
        currentUserEmail
      );

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // ============================================================
  // USE EFFECTS
  // ============================================================
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'WORKER') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (authUser) {
      loadRealStats();
    }
  }, [authUser]);

  // Check for new stats periodically
  useEffect(() => {
    if (!authUser) return;
    
    const interval = setInterval(() => {
      loadRealStats();
    }, 15000);
    
    return () => clearInterval(interval);
   }, [authUser]);

  // ============================================================
  // GENERATE RECENT ACTIVITY
  // ============================================================
  const generateRecentActivity = (
    workerOffers,
    appliedOffers,
    savedOffers,
    payments,
    userEmail
  ) => {
    const activities = [];
    
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
    
    payments.forEach(payment => {
      activities.push({
        icon: 'payment',
        message: `Payment of EGP ${payment.amount} ${payment.status === 'completed' ? 'received' : 'pending'}`,
        time: payment.date ? new Date(payment.date).toLocaleDateString() : 'Recently',
        status: payment.status === 'completed' ? 'Completed' : 'Pending'
      });
    });
    
    activities.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateB - dateA;
    });
    
    setRecentActivity(activities.slice(0, 10));
  };

  // ============================================================
  // USE EFFECTS
  // ============================================================
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'WORKER') {
      navigate('/login');
      return;
    }
  }, [authUser, isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    if (authUser) {
      loadRealStats();
    }
  }, [authUser]);

  // Check for new stats periodically
  useEffect(() => {
    if (!authUser) return;
    
    const interval = setInterval(() => {
      loadRealStats();
    }, 15000);
    
    return () => clearInterval(interval);
  }, [authUser]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t.dashboard}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
        rightContent={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {userIsPremium && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700 hidden sm:inline-flex">
                  <Crown size={10} className="text-yellow-500" />
                  Premium
                </span>
              )}
            </div>
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
        }
      />

        <div className="p-4 md:p-6">
          {/* Welcome Banner - RED THEME */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-800/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">
                  {authUser?.profileImage ? (
                    <img 
                      src={authUser.profileImage} 
                      alt={authUser.fullName || 'Worker'} 
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{t.welcome}, {authUser.fullName || 'Worker'}!</h1>
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
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/worker/offers"
                   className="bg-white text-red-600 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Briefcase size={16} />
                  {t.viewOffers}
                </Link>
                <Link
                  to="/worker-profile"
                   className="bg-white text-red-600 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.pendingOffers}</p>
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pendingOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.acceptedOffers}</p>
                <CheckCircle size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.acceptedOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.inProgress}</p>
                <Zap size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.inProgressOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.completed}</p>
                <CheckCircle size={20} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.completedOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.rejected}</p>
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.rejectedOffers}</p>
            </div>
          </div>

          {/* Stats Row 2 - Financial */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.totalEarnings}</p>
                <span className="text-red-500 font-bold">$</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">EGP {stats.totalEarnings}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.pendingPayments}</p>
                <CreditCard size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.completedJobs}</p>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.completedJobs}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.stats.messages}</p>
                <MessageCircle size={20} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.messages}</p>
            </div>
          </div>

          {/* Quick Actions - RED THEME */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.quickActions}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 group"
              >
                <Briefcase size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-blue-700">{t.findJobs}</span>
              </Link>
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 rounded-lg transition-colors border border-green-200 group"
              >
                <Zap size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-green-700">{t.viewOffers}</span>
              </Link>
              <Link
                to="/worker-profile"
                className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 group"
              >
                <User size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-purple-700">{t.viewProfile}</span>
              </Link>
              <Link
                to="/worker-messages"
                className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-lg transition-colors border border-red-200 group"
              >
                <MessageCircle size={20} className="text-red-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-red-700">{t.viewMessages}</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t.recentActivity}</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>{t.noActivity}</p>
                <p className="text-sm mt-2">Start applying for jobs to see activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.icon === 'offer' || activity.icon === 'zap' ? 'bg-blue-100' :
                      activity.icon === 'check' ? 'bg-green-100' :
                      activity.icon === 'clock' ? 'bg-yellow-100' :
                      activity.icon === 'x' ? 'bg-red-100' :
                      activity.icon === 'payment' ? 'bg-purple-100' :
                      'bg-gray-100 dark:bg-gray-800'
                    }`}>
                      {activity.icon === 'offer' && <Briefcase size={16} className="text-blue-600" />}
                      {activity.icon === 'zap' && <Zap size={16} className="text-green-600" />}
                      {activity.icon === 'check' && <CheckCircle size={16} className="text-green-600" />}
                      {activity.icon === 'clock' && <Clock size={16} className="text-yellow-600" />}
                      {activity.icon === 'x' && <X size={16} className="text-red-600" />}
                      {activity.icon === 'payment' && <CreditCard size={16} className="text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-white">{activity.message}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'Completed' || activity.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        activity.status === 'Pending' || activity.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
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

export default WorkerDashboard;