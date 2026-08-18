// src/pages/WorkerDashboard.jsx - RED AND WHITE THEME WITH ENHANCED NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { fetchSubscriptionStatus } from '../services/paymentService';
import WorkerPremiumCard from '../components/worker/WorkerPremiumCard';
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
  const [subscriptionStatus, setSubscriptionStatus] = useState({ isPremium: false, subscription: null });

  const { t } = useTranslation();

  const userIsPremium = subscriptionStatus.isPremium;

  // Backend subscription = the ONLY source of truth for premium entitlement.
  useEffect(() => {
    let cancelled = false;
    const loadPremium = async () => {
      try {
        const data = await fetchSubscriptionStatus();
        if (!cancelled && data?.success) {
          setSubscriptionStatus({
            isPremium: data.isPremium === true,
            subscription: data.subscription || null
          });
        }
      } catch (error) {
        // Non-fatal: premium defaults to false when the check fails.
        console.error('Failed to load subscription status:', error);
      }
    };
    if (authUser) loadPremium();
    return () => { cancelled = true; };
  }, [authUser]);


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
        type: 'offer',
        icon: icon,
        jobTitle: offer.jobTitle,
        employerName: offer.employerName,
        time: offer.updatedAt ? new Date(offer.updatedAt).toLocaleDateString() : 'Recently',
        status: statusText
      });
    });
    
    payments.forEach(payment => {
      activities.push({
        type: 'payment',
        icon: 'payment',
        amount: payment.amount,
        paymentState: payment.status,
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

  const formatActivityStatus = (status) => {
    const statusKeys = {
      'Pending Review': 'pendingReview',
      Pending: 'pending',
      Accepted: 'accepted',
      'In Progress': 'inProgress',
      Completed: 'completed',
      Rejected: 'rejected',
      Unknown: 'unknown'
    };
    const key = statusKeys[status];
    return key ? t(`workerDashboard.status.${key}`) : status;
  };

  const formatActivityMessage = (activity) => {
    if (activity.type === 'payment') {
      return t('workerDashboard.activity.payment', {
        amount: activity.amount,
        state: activity.paymentState === 'completed'
          ? t('workerDashboard.activity.received')
          : t('workerDashboard.status.pending')
      });
    }
    return t('workerDashboard.activity.offer', {
      job: activity.jobTitle || t('workerDashboard.activity.jobOffer'),
      employer: activity.employerName || t('workerDashboard.activity.employer'),
      status: formatActivityStatus(activity.status)
    });
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('workerDashboard.loading')}</p>
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
        title={t('workerDashboard.dashboard')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
      />

        <div className="p-4 md:p-6">
          {/* Welcome Banner - RED THEME */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 mb-6 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-full overflow-hidden flex-shrink-0 ${
                  userIsPremium
                    ? 'ring-2 ring-[#F5C542] shadow-[0_0_8px_rgba(245,197,66,0.55),0_0_16px_rgba(245,197,66,0.25)]'
                    : 'border-2 border-white/50'
                }`}>
                  {authUser?.profileImage ? (
                    <img 
                      src={authUser.profileImage} 
                      alt={authUser.fullName || t('workerDashboard.worker')}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-white dark:bg-gray-800/20 flex items-center justify-center">
                      <User size={28} className="text-white m-3" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className={`text-2xl font-bold ${userIsPremium ? 'text-amber-300' : ''}`}>{t('workerDashboard.welcomeName', { name: authUser.fullName || t('workerDashboard.worker') })}</h1>
                    {userIsPremium && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium text-white">
                        <Crown size={12} className="text-yellow-300" />
                        {t('workerDashboard.premiumBadge')}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 mt-1">{t('workerDashboard.overview')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/worker/offers"
                   className="bg-white text-red-600 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <Briefcase size={16} />
                  {t('workerDashboard.viewOffers')}
                </Link>
                <Link
                  to="/worker-profile"
                   className="bg-white text-red-600 hover:bg-gray-100 dark:bg-gray-800/20 dark:hover:bg-gray-800/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <User size={16} />
                  {t('workerDashboard.viewProfile')}
                </Link>
                {!userIsPremium && (
                  <Link
                    to="/subscription"
                    className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm border border-yellow-400/30"
                  >
                    <Crown size={16} />
                    {t('workerDashboard.getPremium')}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.pendingOffers')}</p>
                <Clock size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pendingOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.acceptedOffers')}</p>
                <CheckCircle size={20} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.acceptedOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.inProgress')}</p>
                <Zap size={20} className="text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.inProgressOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.completed')}</p>
                <CheckCircle size={20} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.completedOffers}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.rejected')}</p>
                <X size={20} className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.rejectedOffers}</p>
            </div>
          </div>

          {/* Stats Row 2 - Financial */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.totalEarnings')}</p>
                <span className="text-red-500 font-bold">$</span>
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">EGP {stats.totalEarnings}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.pendingPayments')}</p>
                <CreditCard size={20} className="text-yellow-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pendingPayments}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.completedJobs')}</p>
                <CheckCircle size={20} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.completedJobs}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('workerDashboard.stats.messages')}</p>
                <MessageCircle size={20} className="text-indigo-500" />
              </div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.messages}</p>
            </div>
          </div>

          {/* Premium & Availability — backend-enforced */}
          <div className="mb-6">
            <WorkerPremiumCard />
          </div>

          {/* Quick Actions - RED THEME */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('workerDashboard.quickActions')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 group"
              >
                <Briefcase size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-blue-700">{t('workerDashboard.findJobs')}</span>
              </Link>
              <Link
                to="/worker/offers"
                className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 rounded-lg transition-colors border border-green-200 group"
              >
                <Zap size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-green-700">{t('workerDashboard.viewOffers')}</span>
              </Link>
              <Link
                to="/worker-profile"
                className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200 group"
              >
                <User size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-purple-700">{t('workerDashboard.viewProfile')}</span>
              </Link>
              <Link
                to="/worker-messages"
                className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 rounded-lg transition-colors border border-red-200 group"
              >
                <MessageCircle size={20} className="text-red-600 group-hover:scale-110 transition-transform" />
                <span className="font-medium text-red-700">{t('workerDashboard.viewMessages')}</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('workerDashboard.recentActivity')}</h3>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>{t('workerDashboard.noActivity')}</p>
                <p className="text-sm mt-2">{t('workerDashboard.startApplying')}</p>
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
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-medium text-gray-800 dark:text-white">{formatActivityMessage(activity)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{activity.time === 'Recently' ? t('workerDashboard.recently') : activity.time}</p>
                    </div>
                    {activity.status && (
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${
                        activity.status === 'Completed' || activity.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                        activity.status === 'Pending' || activity.status === 'Pending Review' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                        {formatActivityStatus(activity.status)}
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
