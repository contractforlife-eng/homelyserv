// src/pages/WorkerOffers.jsx - FIXED: Shows "Paid" status when payment is completed
import React, { useState, useEffect } from 'react';
import { useDashboard } from '../components/layout/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import hireService from '../services/hireService';
import {
  Bell,
  X,
  CheckCircle,
  Search,
  MapPin,
  DollarSign,
  Eye,
  ThumbsUp,
  Star,
  MessageSquare,
  Loader2,
  Building2,
  Crown,
  AlertCircle,
  RefreshCw,
  Inbox,
  XCircle,
  CheckCheck,
  Wallet,
  Clock,
  Zap,
  User,
  ChevronRight
} from 'lucide-react';
import { 
  getConversationId, 
  sendMessage, 
  getUserConversations,
} from '../utils/chatService';

// ============================================================
// MAIN WORKER OFFERS COMPONENT - FIXED PAYMENT STATUS
// ============================================================
const WorkerOffers = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [processingOffer, setProcessingOffer] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const dashboard = useDashboard();

  const toggleExpand = (offerId) => {
    setExpandedOffer(expandedOffer === offerId ? null : offerId);
  };

  const isPremium = () => {
    const userId = authUser?.id || authUser?.email;
    if (!userId) return false;
    return isUserPremium(userId);
  };

  const userIsPremium = isPremium();

  const translations = {
    en: {
      title: 'My Offers',
      subtitle: 'Review and respond to job offers',
      tabs: {
        pending: 'Pending',
        accepted: 'Accepted',
        paid: 'Paid',
        rejected: 'Rejected',
        completed: 'Completed'
      },
      stats: {
        pending: 'Pending',
        accepted: 'Accepted',
        paid: 'Paid',
        rejected: 'Rejected',
        completed: 'Completed',
        total: 'Total'
      },
      card: {
        viewDetails: 'View Details',
        accept: 'Accept',
        reject: 'Decline',
        salaryPerMonth: '/month',
        location: 'Location',
        posted: 'Posted',
        employer: 'Employer',
        noOffers: 'No offers in this section',
        chat: 'Chat',
        completeWork: 'Complete Work',
        waitingPayment: '⏳ Waiting for payment...',
        paymentReceived: '✅ Payment Received',
        workCompleted: 'Work Completed',
        offerRejected: 'Offer Declined',
        inProgress: 'In Progress',
        paid: 'Paid'
      },
      actions: {
        accept: 'Accept Offer',
        rejecting: 'Rejecting...',
        accepting: 'Accepting...',
        view: 'View Details',
        close: 'Close'
      },
      empty: {
        title: 'No offers yet',
        description: 'You haven\'t received any job offers',
        wait: 'Employers will reach out when they find your profile'
      },
      loading: 'Loading offers...',
      languageToggle: 'العربية',
      notifications: 'Notifications',
      acceptSuccess: '✅ Offer accepted from {employer}!',
      rejectSuccess: 'You declined the offer from {employer}',
      acceptError: 'Failed to accept offer. Please try again.',
      rejectError: 'Failed to decline offer. Please try again.',
      premiumBadge: 'Premium',
      getPremium: 'Upgrade',
      noNotifications: 'No new notifications'
    },
    ar: {
      title: 'عروضي',
      subtitle: 'مراجعة والرد على عروض العمل',
      tabs: {
        pending: 'معلقة',
        accepted: 'مقبولة',
        paid: 'مدفوعة',
        rejected: 'مرفوضة',
        completed: 'مكتملة'
      },
      stats: {
        pending: 'معلقة',
        accepted: 'مقبولة',
        paid: 'مدفوعة',
        rejected: 'مرفوضة',
        completed: 'مكتملة',
        total: 'الإجمالي'
      },
      card: {
        viewDetails: 'عرض التفاصيل',
        accept: 'قبول',
        reject: 'رفض',
        salaryPerMonth: '/شهر',
        location: 'الموقع',
        posted: 'نشر',
        employer: 'صاحب العمل',
        noOffers: 'لا توجد عروض في هذا القسم',
        chat: 'محادثة',
        completeWork: 'إكمال العمل',
        waitingPayment: '⏳ في انتظار الدفع...',
        paymentReceived: '✅ تم استلام الدفع',
        workCompleted: 'تم إكمال العمل',
        offerRejected: 'تم رفض العرض',
        inProgress: 'قيد التنفيذ',
        paid: 'مدفوعة'
      },
      actions: {
        accept: 'قبول العرض',
        rejecting: 'جاري الرفض...',
        accepting: 'جاري القبول...',
        view: 'عرض التفاصيل',
        close: 'إغلاق'
      },
      empty: {
        title: 'لا توجد عروض',
        description: 'لم تتلق أي عروض عمل بعد',
        wait: 'سيتواصل معك أصحاب العمل عند العثور على ملفك الشخصي'
      },
      loading: 'جاري تحميل العروض...',
      languageToggle: 'English',
      notifications: 'الإشعارات',
      acceptSuccess: '✅ تم قبول العرض من {employer}!',
      rejectSuccess: 'لقد رفضت العرض من {employer}',
      acceptError: 'فشل قبول العرض. يرجى المحاولة مرة أخرى.',
      rejectError: 'فشل رفض العرض. يرجى المحاولة مرة أخرى.',
      premiumBadge: 'مميز',
      getPremium: 'ترقية',
      noNotifications: 'لا توجد إشعارات جديدة'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  // ============================================================
  // Load Offers - FIXED: No clearing of offers before fetch
  // ============================================================
  const loadOffers = async (userParam) => {
    setLoading(true);
    try {
      const currentUser = userParam || authUser;

      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      const data = await hireService.getOffers();
      const allOffers = Array.isArray(data.offers || data) ? (data.offers || data) : [];

      allOffers.sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt));

      setOffers(allOffers);
      return allOffers;
    } catch (error) {
      console.error('[loadOffers] ERROR', error);
      // Keep existing offers - do NOT setOffers([])
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // USE EFFECTS
  // ============================================================
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !authUser) {
      return;
    }

    if (authUser.role !== 'WORKER') {
      return;
    }

    loadOffers(authUser);
  }, [authUser, isAuthenticated, authLoading]);

  useEffect(() => {
    if (authUser?.id) {
      loadOffers(authUser);
    }
  }, [authUser?.id, refreshKey]);

  useEffect(() => {
    if (!authUser) {
      return;
    }
    const interval = setInterval(() => {
      loadOffers(authUser);
    }, 15000);
    return () => {
      clearInterval(interval);
    };
  }, [authUser]);

  // ============================================================
  // Accept Offer Handler
  // ============================================================
  const handleAcceptOffer = async (offer) => {
    if (processingOffer) return;
    setProcessingOffer(offer.id);

    try {
      console.log(`📝 Accepting offer: ${offer.id} - ${offer.jobTitle}`);
      
      const data = await hireService.acceptOffer(offer.id);
      const updatedOffer = data.offer || {
        ...offer,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
        workerResponseAt: new Date().toISOString()
      };

      // Create conversation
      const workerId = authUser?.id;
      const workerName = authUser?.fullName || 'Worker';
      const employerId = offer.employerId;
      const employerName = offer.employerName || 'Employer';

      if (workerId && employerId) {
        createConversationAndSendWelcome(offer, workerId, workerName, employerId, employerName);
      }

      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      alert(t.acceptSuccess.replace('{employer}', offer.employerName || 'Employer'));
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(t.acceptError);
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // Reject Offer Handler
  // ============================================================
  const handleRejectOffer = async (offer) => {
    if (processingOffer) return;
    
    if (!confirm(`Are you sure you want to decline the offer from ${offer.employerName || 'Employer'}?`)) {
      return;
    }

    setProcessingOffer(offer.id);

    try {
      const data = await hireService.rejectOffer(offer.id);
      const updatedOffer = data.offer || {
        ...offer,
        status: 'rejected',
        updatedAt: new Date().toISOString(),
        workerResponseAt: new Date().toISOString()
      };

      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      alert(t.rejectSuccess.replace('{employer}', offer.employerName || 'Employer'));
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error('Error rejecting offer:', error);
      alert(t.rejectError);
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // Complete Work Handler
  // ============================================================
  const handleCompleteWork = async (offer) => {
    if (processingOffer) return;
    
    if (!confirm('Mark this job as completed? This cannot be undone.')) {
      return;
    }

    setProcessingOffer(offer.id);

    try {
      const data = await hireService.completeWork(offer.id);
      const updatedOffer = data.offer || {
        ...offer,
        status: 'completed',
        updatedAt: new Date().toISOString()
      };

      setOffers(prev => prev.map(o => o.id === offer.id ? updatedOffer : o));
      alert('✅ Work completed successfully!');
      setRefreshKey(prev => prev + 1);

    } catch (error) {
      console.error('Error completing work:', error);
      alert('Failed to complete work. Please try again.');
    } finally {
      setProcessingOffer(null);
    }
  };

  // ============================================================
  // Conversation Creation
  // ============================================================
  const createConversationAndSendWelcome = async (offer, workerId, workerName, employerId, employerName) => {
    try {
      const welcomeMessage = `Hello! I've accepted your job offer for ${offer.jobTitle || 'the position'}. I'm excited to work with you. Let me know the next steps.`;
      
      // Use the backend API to ensure conversation exists and send message
      const result = await sendMessage(workerId, workerName, 'WORKER', employerId, employerName, welcomeMessage);
      console.log('✅ Conversation created and welcome message sent');
      
      return result?.conversationId || getConversationId(workerId, employerId);
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // ============================================================
  // UI Helpers
  // ============================================================
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-50 border-amber-200 text-amber-700',
      accepted: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 text-blue-700',
      paid: 'bg-green-50 dark:bg-green-900/30 border-green-200 text-green-700',
      rejected: 'bg-red-50 dark:bg-red-900/30 border-red-200 text-red-700',
      in_progress: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      completed: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 text-purple-700'
    };
    return colors[status] || 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="text-amber-500" />;
      case 'accepted': return <CheckCircle size={14} className="text-blue-500" />;
      case 'paid': return <Wallet size={14} className="text-green-500" />;
      case 'rejected': return <XCircle size={14} className="text-red-500" />;
      case 'in_progress': return <Zap size={14} className="text-emerald-500" />;
      case 'completed': return <CheckCheck size={14} className="text-purple-500" />;
      default: return <AlertCircle size={14} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      accepted: 'Accepted',
      paid: 'Paid',
      rejected: 'Declined',
      in_progress: 'In Progress',
      completed: 'Completed'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatSalary = (amount) => {
    return `${amount?.toLocaleString() || 0}`;
  };

  // ============================================================
  // Filtered Offers by Tab
  // ============================================================
  const getFilteredOffers = () => {
    let filtered = [];
    switch (activeTab) {
      case 'pending':
        filtered = offers.filter(o => o.status === 'pending');
        break;
      case 'accepted':
        filtered = offers.filter(o => o.status === 'accepted');
        break;
      case 'paid':
        filtered = offers.filter(o => o.status === 'paid' || o.status === 'in_progress');
        break;
      case 'rejected':
        filtered = offers.filter(o => o.status === 'rejected');
        break;
      case 'completed':
        filtered = offers.filter(o => o.status === 'completed');
        break;
      default:
        filtered = offers;
    }
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.jobTitle?.toLowerCase().includes(searchLower) ||
        o.employerName?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const filteredOffers = getFilteredOffers();

  const stats = {
    pending: offers.filter(o => o.status === 'pending').length,
    accepted: offers.filter(o => o.status === 'accepted').length,
    paid: offers.filter(o => o.status === 'paid' || o.status === 'in_progress').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    completed: offers.filter(o => o.status === 'completed').length,
    total: offers.length
  };

  const tabItems = [
    { id: 'pending', label: t.tabs.pending, icon: Clock, count: stats.pending },
    { id: 'accepted', label: t.tabs.accepted, icon: CheckCircle, count: stats.accepted },
    { id: 'paid', label: t.tabs.paid, icon: Wallet, count: stats.paid },
    { id: 'rejected', label: t.tabs.rejected, icon: XCircle, count: stats.rejected },
    { id: 'completed', label: t.tabs.completed, icon: CheckCheck, count: stats.completed }
  ];

  // ============================================================
  // Render Offer Card
  // ============================================================
  const renderOfferCard = (offer) => {
    const statusColor = getStatusColor(offer.status);
    const statusIcon = getStatusIcon(offer.status);
    const statusLabel = getStatusLabel(offer.status);
    const isExpanded = expandedOffer === offer.id;

    return (
      <div
        key={offer.id}
        className={`bg-white dark:bg-gray-800 rounded-xl border ${statusColor} shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
              {offer.workerImage ? (
                <img 
                  src={offer.workerImage} 
                  alt={offer.workerName} 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User size={24} className="text-red-600" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{offer.jobTitle || 'Job Offer'}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Building2 size={14} />
                    <span>{offer.employerName || 'Employer'}</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${statusColor} whitespace-nowrap`}>
                  {statusIcon}
                  {statusLabel}
                </span>
              </div>

              {/* Details Row */}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>{offer.workerLocation || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>EGP {formatSalary(offer.amount)}<span className="text-gray-400 dark:text-gray-500 text-xs">/mo</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400 dark:text-gray-500" />
                  <span>{formatDate(offer.createdAt || offer.updatedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star size={14} className="text-yellow-400 fill-yellow-400" />
                  <span>{offer.workerRating || 4.5}</span>
                </div>
              </div>

              {/* Payment Status Badge */}
              {offer.paymentCompleted === true && offer.status !== 'completed' && offer.status !== 'paid' && (
                <div className="mt-2.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                    <Wallet size={12} />
                    Payment Confirmed
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => toggleExpand(offer.id)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 transition-colors"
                >
                  <Eye size={15} />
                  {isExpanded ? 'Hide Details' : t.card.viewDetails}
                </button>
                
                {offer.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAcceptOffer(offer)}
                      disabled={processingOffer === offer.id}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOffer === offer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ThumbsUp size={14} />
                      )}
                      {t.card.accept}
                    </button>
                    <button
                      onClick={() => handleRejectOffer(offer)}
                      disabled={processingOffer === offer.id}
                      className="px-4 py-1.5 border border-red-300 text-red-600 hover:bg-red-50 dark:bg-red-900/30 text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOffer === offer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                      {t.card.reject}
                    </button>
                  </>
                )}

                {offer.status === 'accepted' && (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-sm rounded-lg flex items-center gap-1.5">
                    <Clock size={14} />
                    {t.card.waitingPayment}
                  </span>
                )}

                {offer.status === 'paid' && (
                  <>
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg flex items-center gap-1.5">
                      <Wallet size={14} />
                      {t.card.paymentReceived}
                    </span>
                    <button
                      onClick={() => navigate('/worker-messages')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      {t.card.chat}
                    </button>
                  </>
                )}

                {offer.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleCompleteWork(offer)}
                      disabled={processingOffer === offer.id}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {processingOffer === offer.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCheck size={14} />
                      )}
                      {t.card.completeWork}
                    </button>
                    <button
                      onClick={() => navigate('/worker-messages')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-1.5"
                    >
                      <MessageSquare size={14} />
                      {t.card.chat}
                    </button>
                  </>
                )}

                {offer.status === 'completed' && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 text-sm rounded-lg flex items-center gap-1.5">
                    <CheckCheck size={14} />
                    {t.card.workCompleted}
                  </span>
                )}

                {offer.status === 'rejected' && (
                  <span className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg flex items-center gap-1.5">
                    <XCircle size={14} />
                    {t.card.offerRejected}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Offer Details</h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Employer</span>
                      <span className="font-medium">{offer.employerName || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Position</span>
                      <span className="font-medium">{offer.jobTitle || 'Service Provider'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Monthly Salary</span>
                      <span className="font-medium">EGP {formatSalary(offer.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Hourly Rate</span>
                      <span className="font-medium">EGP {offer.hourlyRate || 30}/hr</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Location</span>
                      <span className="font-medium">{offer.workerLocation || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Posted</span>
                      <span className="font-medium">{formatDate(offer.createdAt)}</span>
                    </div>
                    {offer.workerResponseAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Responded</span>
                        <span className="font-medium">{formatDate(offer.workerResponseAt)}</span>
                      </div>
                    )}
                    {offer.workCompletedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Completed</span>
                        <span className="font-medium">{formatDate(offer.workCompletedAt)}</span>
                      </div>
                    )}
                    {offer.paymentCompleted && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Payment Status</span>
                        <span className="font-medium text-green-600">✅ Paid</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm">Status</h4>
                  <div className={`p-3 rounded-lg border ${statusColor}`}>
                    <div className="flex items-center gap-2">
                      {statusIcon}
                      <span className="font-medium">{statusLabel}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5">
                      {offer.status === 'pending' && 'Awaiting your decision on this offer.'}
                      {offer.status === 'accepted' && 'You accepted this offer. Waiting for employer payment.'}
                      {offer.status === 'paid' && '✅ Payment received! You can now start working.'}
                      {offer.status === 'in_progress' && 'Work is in progress.'}
                      {offer.status === 'completed' && 'Work has been completed successfully.'}
                      {offer.status === 'rejected' && 'You declined this offer.'}
                    </p>
                  </div>
                  {(offer.status === 'paid' || offer.status === 'in_progress' || offer.status === 'accepted' || offer.status === 'completed') && (
                    <button
                      onClick={() => navigate('/worker-messages')}
                      className="mt-3 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                    >
                      <MessageSquare size={16} />
                      Message Employer
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // Main Render
  // ============================================================
  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={userIsPremium}
      />

      <div className="p-4 md:p-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-red-100 mt-1">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-red-200">
                {stats.total} total offers
              </span>
              {!userIsPremium && (
                <Link
                  to="/subscription"
                  className="bg-yellow-400/20 hover:bg-yellow-400/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-yellow-400/30"
                >
                  <Crown size={16} className="text-yellow-300" />
                  {t.getPremium}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.pending}</p>
              <Clock size={18} className="text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.accepted}</p>
              <CheckCircle size={18} className="text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.accepted}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.paid}</p>
              <Wallet size={18} className="text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.paid}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.rejected}</p>
              <XCircle size={18} className="text-red-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.rejected}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.stats.completed}</p>
              <CheckCheck size={18} className="text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.completed}</p>
          </div>
        </div>

        {/* Search & Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search offers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>
            <button
              onClick={() => {
                loadOffers(authUser);
                setRefreshKey(prev => prev + 1);
              }}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center gap-2 text-sm"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-t border-gray-100 dark:border-gray-700 pt-4 overflow-x-auto">
            {tabItems.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:bg-gray-900 hover:text-gray-700 dark:text-gray-300'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredOffers.length}</span> offers
          </p>
        </div>

        {/* Offers List - Only show loading spinner on initial load */}
        {loading && offers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col items-center justify-center">
              <Loader2 size={40} className="animate-spin text-red-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t.loading}</p>
            </div>
          </div>
        ) : offers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={32} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.empty.title}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t.empty.description}</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t.empty.wait}</p>
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">No results found</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map(offer => renderOfferCard(offer))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkerOffers;