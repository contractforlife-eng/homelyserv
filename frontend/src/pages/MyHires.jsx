// src/pages/MyHires.jsx - Employer hire management dashboard
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import hireService from '../services/hireService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import {
  User,
  Briefcase,
  MessageCircle,
  Clock,
  Calendar,
  Star as StarIcon,
  CheckCircle,
  Eye,
  RefreshCw,
  Crown,
  Search as SearchIcon,
  Users,
  AlertTriangle,
  Mail,
  MapPin,
  Phone,
  Wallet,
  X as XIcon,
  X
} from 'lucide-react';
import { sendMessage, getConversationId } from '../utils/chatService';

// ============================================================
// SINGLE SOURCE OF TRUTH — canonical hire statuses
// These mirror the values actually stored by the backend Hire model:
//   offer_sent  -> worker accepted, awaiting commission payment
//   active      -> commission paid, employment running
//   terminated  -> employer ended the hire
// ============================================================
const HIRE_STATUS = {
  OFFER_SENT: 'offer_sent',
  ACTIVE: 'active',
  TERMINATED: 'terminated'
};

// Collapse legacy / alias values (from older records) into canonical ones
const normalizeStatus = (status) => {
  switch (status) {
    case 'hired':
    case 'accepted':
    case 'completed': // legacy records: a paid/finished hire is treated as active
      return HIRE_STATUS.ACTIVE;
    case 'pending':
      return HIRE_STATUS.OFFER_SENT;
    case 'cancelled':
    case 'canceled':
      return HIRE_STATUS.TERMINATED;
    case HIRE_STATUS.OFFER_SENT:
    case HIRE_STATUS.ACTIVE:
    case HIRE_STATUS.TERMINATED:
      return status;
    default:
      return status || HIRE_STATUS.OFFER_SENT;
  }
};

const MyHires = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const dashboard = useDashboard();

  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHire, setSelectedHire] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminatingHire, setTerminatingHire] = useState(null);
  const [terminating, setTerminating] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);

  const isPremium = useMemo(() => {
    const userId = authUser?.id || authUser?.email;
    return userId ? isUserPremium(userId) : false;
  }, [authUser]);

  const translations = {
    en: {
      title: 'My Hires',
      subtitle: 'Manage your hired workers',
      stats: {
        total: 'Total Hires',
        active: 'Active',
        awaitingPayment: 'Awaiting Payment',
        terminated: 'Terminated'
      },
      status: {
        offer_sent: 'Awaiting Payment',
        active: 'Active',
        terminated: 'Terminated'
      },
      payment: {
        paid: 'Paid',
        unpaid: 'Unpaid',
        pending: 'Processing'
      },
      table: {
        worker: 'Worker',
        job: 'Job Title',
        salary: 'Salary',
        commission: 'Commission',
        hiredOn: 'Hired On',
        status: 'Status',
        payment: 'Payment',
        actions: 'Actions'
      },
      modal: {
        title: 'Hire Details',
        salary: 'Salary',
        commission: 'Commission',
        startDate: 'Start Date',
        endDate: 'End Date',
        status: 'Status',
        contact: 'Contact Information',
        rating: 'Rating',
        terminate: 'Terminate',
        message: 'Send Message'
      },
      terminate: {
        title: 'Terminate Hire',
        confirm: 'Are you sure you want to terminate this hire?',
        reason: 'Reason for termination (optional)',
        placeholder: 'Enter reason...',
        cancel: 'Cancel',
        confirmButton: 'Terminate Hire',
        processing: 'Terminating...',
        success: 'Hire terminated successfully',
        error: 'Error terminating hire'
      },
      actions: {
        view: 'View Details',
        terminate: 'Terminate',
        message: 'Message Worker'
      },
      filters: {
        all: 'All Hires',
        offer_sent: 'Awaiting Payment',
        active: 'Active',
        terminated: 'Terminated'
      },
      empty: {
        title: 'No hires yet',
        description: "You haven't hired any workers yet",
        start: 'Find workers to hire'
      },
      loading: 'Loading hires...',
      searchPlaceholder: 'Search by worker name or job title...',
      noResults: 'No hires match your search',
      clearFilters: 'Clear filters',
      refresh: 'Refresh',
      salaryPerMonth: 'EGP/mo',
      showing: 'Showing',
      hiresWord: 'hires'
    },
    ar: {
      title: 'توظيفاتي',
      subtitle: 'إدارة العمال الذين قمت بتوظيفهم',
      stats: {
        total: 'إجمالي التوظيفات',
        active: 'نشط',
        awaitingPayment: 'في انتظار الدفع',
        terminated: 'منتهي'
      },
      status: {
        offer_sent: 'في انتظار الدفع',
        active: 'نشط',
        terminated: 'منتهي'
      },
      payment: {
        paid: 'مدفوع',
        unpaid: 'غير مدفوع',
        pending: 'قيد المعالجة'
      },
      table: {
        worker: 'العامل',
        job: 'المسمى الوظيفي',
        salary: 'الراتب',
        commission: 'العمولة',
        hiredOn: 'تاريخ التوظيف',
        status: 'الحالة',
        payment: 'الدفع',
        actions: 'الإجراءات'
      },
      modal: {
        title: 'تفاصيل التوظيف',
        salary: 'الراتب',
        commission: 'العمولة',
        startDate: 'تاريخ البدء',
        endDate: 'تاريخ الانتهاء',
        status: 'الحالة',
        contact: 'معلومات الاتصال',
        rating: 'التقييم',
        terminate: 'إنهاء',
        message: 'إرسال رسالة'
      },
      terminate: {
        title: 'إنهاء التوظيف',
        confirm: 'هل أنت متأكد من رغبتك في إنهاء هذا التوظيف؟',
        reason: 'سبب الإنهاء (اختياري)',
        placeholder: 'أدخل السبب...',
        cancel: 'إلغاء',
        confirmButton: 'إنهاء التوظيف',
        processing: 'جاري الإنهاء...',
        success: 'تم إنهاء التوظيف بنجاح',
        error: 'خطأ في إنهاء التوظيف'
      },
      actions: {
        view: 'عرض التفاصيل',
        terminate: 'إنهاء',
        message: 'مراسلة العامل'
      },
      filters: {
        all: 'جميع التوظيفات',
        offer_sent: 'في انتظار الدفع',
        active: 'نشط',
        terminated: 'منتهي'
      },
      empty: {
        title: 'لا توجد توظيفات',
        description: 'لم تقم بتوظيف أي عامل بعد',
        start: 'ابحث عن عمال للتوظيف'
      },
      loading: 'جاري تحميل التوظيفات...',
      searchPlaceholder: 'ابحث باسم العامل أو المسمى الوظيفي...',
      noResults: 'لا توجد توظيفات تطابق بحثك',
      clearFilters: 'مسح التصفيات',
      refresh: 'تحديث',
      salaryPerMonth: 'جنيه/شهر',
      showing: 'عرض',
      hiresWord: 'توظيف'
    }
  };

  const t = translations[dashboard.language] || translations.en;

  // ============================================================
  // LOAD HIRES
  // ============================================================
  const loadHires = useCallback(async () => {
    if (!authUser?.email) {
      setHires([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const hiresData = await hireService.getMyHires();
      const employerHires = Array.isArray(hiresData) ? hiresData : [];

      employerHires.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startDate || 0);
        const dateB = new Date(b.createdAt || b.startDate || 0);
        return dateB - dateA;
      });

      setHires(employerHires);
    } catch (error) {
      console.error('Error loading hires:', error);
      setHires([]);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }

    loadHires();
  }, [authUser, isAuthenticated, authLoading, navigate, loadHires]);

  // ============================================================
  // SINGLE FILTERING PIPELINE (one memoized selector)
  // ============================================================
  const filteredHires = useMemo(() => {
    let list = hires;

    if (statusFilter !== 'all') {
      list = list.filter(hire => normalizeStatus(hire.status) === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(hire =>
        hire.workerName?.toLowerCase().includes(q) ||
        hire.jobTitle?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [hires, statusFilter, searchTerm]);

  // Stats derived from the same canonical statuses
  const stats = useMemo(() => {
    const normalized = hires.map(h => normalizeStatus(h.status));
    return {
      total: hires.length,
      active: normalized.filter(s => s === HIRE_STATUS.ACTIVE).length,
      awaitingPayment: normalized.filter(s => s === HIRE_STATUS.OFFER_SENT).length,
      terminated: normalized.filter(s => s === HIRE_STATUS.TERMINATED).length
    };
  }, [hires]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleRefresh = () => loadHires();

  const handleViewDetails = (hire) => {
    setSelectedHire(hire);
    setShowDetailsModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedHire(null);
  };

  const handleTerminateClick = (hire) => {
    setTerminatingHire(hire);
    setTerminateReason('');
    setShowTerminateModal(true);
    setShowDetailsModal(false);
  };

  // Persist termination to the backend so status is truthful after refresh
  const handleTerminateHire = async () => {
    if (!terminatingHire || terminating) return;

    const hireId = terminatingHire.id || terminatingHire.hireId;
    const terminationDate = new Date().toISOString();
    const reason = terminateReason || 'No reason provided';

    setTerminating(true);
    try {
      if (hireId) {
        await hireService.updateHireStatus(hireId, HIRE_STATUS.TERMINATED);
      }

      setHires(prev => prev.map(h =>
        (h.id === terminatingHire.id || h.hireId === terminatingHire.hireId)
          ? { ...h, status: HIRE_STATUS.TERMINATED, terminationDate, terminationReason: reason }
          : h
      ));

      setShowTerminateModal(false);
      setTerminatingHire(null);
      alert(t.terminate.success);
    } catch (error) {
      console.error('Error terminating hire:', error);
      alert(t.terminate.error);
    } finally {
      setTerminating(false);
    }
  };

  const handleSendMessage = async (hire) => {
    if (!hire) return;

    const workerId = hire.workerId;
    const workerName = hire.workerName || 'Worker';

    if (!workerId) {
      alert('Unable to open chat: Worker ID not found');
      return;
    }

    const employerId = authUser?.id;
    const employerName = authUser?.fullName || 'Employer';

    try {
      setCreatingConversation(true);
      await sendMessage(
        employerId,
        employerName,
        'EMPLOYER',
        workerId,
        workerName,
        `Hello ${workerName}! Let's discuss your work.`
      );
    } catch (error) {
      console.error('Error ensuring conversation:', error);
    } finally {
      setCreatingConversation(false);
    }

    // Deterministic conversation id (same algorithm as chat backend)
    const conversationId = getConversationId(employerId, workerId);

    navigate(
      `/employer-messages?workerId=${encodeURIComponent(workerId)}&workerName=${encodeURIComponent(workerName)}`,
      { state: { conversationId, workerId, workerName } }
    );
  };

  // ============================================================
  // PRESENTATION HELPERS
  // ============================================================
  const getStatusBadge = (status) => {
    const canonical = normalizeStatus(status);
    const styles = {
      [HIRE_STATUS.ACTIVE]: 'bg-green-50 text-green-700 border-green-200',
      [HIRE_STATUS.OFFER_SENT]: 'bg-amber-50 text-amber-700 border-amber-200',
      [HIRE_STATUS.TERMINATED]: 'bg-red-50 text-red-700 border-red-200'
    };
    const icons = {
      [HIRE_STATUS.ACTIVE]: <CheckCircle size={13} />,
      [HIRE_STATUS.OFFER_SENT]: <Clock size={13} />,
      [HIRE_STATUS.TERMINATED]: <XIcon size={13} />
    };
    return {
      className: styles[canonical] || 'bg-gray-100 text-gray-700 border-gray-200',
      icon: icons[canonical] || <AlertTriangle size={13} />,
      label: t.status[canonical] || canonical
    };
  };

  const getPaymentBadge = (hire) => {
    const ps = (hire.paymentStatus || '').toLowerCase();
    if (ps === 'completed' || ps === 'confirmed' || ps === 'paid') {
      return { className: 'bg-green-50 text-green-700 border-green-200', label: t.payment.paid };
    }
    if (ps === 'pending' || ps === 'processing') {
      return { className: 'bg-amber-50 text-amber-700 border-amber-200', label: t.payment.pending };
    }
    return { className: 'bg-gray-100 text-gray-600 border-gray-200', label: t.payment.unpaid };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => `${Number(amount || 0).toLocaleString()}`;

  const getCommission = (hire) => hire.commissionAmount ?? hire.totalDue ?? null;

  const canMessageOrTerminate = (hire) => {
    const s = normalizeStatus(hire.status);
    return s === HIRE_STATUS.ACTIVE;
  };

  const hasActiveFilters = statusFilter !== 'all' || searchTerm.trim() !== '';

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchTerm('');
  };

  // ============================================================
  // RENDER
  // ============================================================
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  const statCards = [
    { key: 'total', label: t.stats.total, value: stats.total, icon: Users, color: 'teal' },
    { key: 'active', label: t.stats.active, value: stats.active, icon: CheckCircle, color: 'green' },
    { key: 'awaitingPayment', label: t.stats.awaitingPayment, value: stats.awaitingPayment, icon: Clock, color: 'amber' },
    { key: 'terminated', label: t.stats.terminated, value: stats.terminated, icon: XIcon, color: 'red' }
  ];

  const statColor = {
    teal: 'bg-teal-50 dark:bg-teal-900/30 text-teal-600',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600'
  };

  return (
    <DashboardLayout requiredRole="EMPLOYER">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isPremium}
        rightContent={
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw size={16} />
            {t.refresh}
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-6">
        {/* Page heading + summary strip */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Users size={16} className="text-teal-600" />
            <span className="font-medium text-gray-700 dark:text-gray-300">{stats.total}</span>
            <span>{t.hiresWord}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.key}
                onClick={() => setStatusFilter(card.key === 'total' ? 'all' : card.key === 'awaitingPayment' ? HIRE_STATUS.OFFER_SENT : card.key === 'terminated' ? HIRE_STATUS.TERMINATED : HIRE_STATUS.ACTIVE)}
                className={`text-left bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border transition-all hover:shadow-md ${
                  (card.key === 'total' && statusFilter === 'all') ||
                  (card.key === 'active' && statusFilter === HIRE_STATUS.ACTIVE) ||
                  (card.key === 'awaitingPayment' && statusFilter === HIRE_STATUS.OFFER_SENT) ||
                  (card.key === 'terminated' && statusFilter === HIRE_STATUS.TERMINATED)
                    ? 'border-teal-400 ring-1 ring-teal-400'
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statColor[card.color]}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{card.value}</p>
              </button>
            );
          })}
        </div>

        {/* Search + Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
            >
              <option value="all">{t.filters.all}</option>
              <option value={HIRE_STATUS.ACTIVE}>{t.filters.active}</option>
              <option value={HIRE_STATUS.OFFER_SENT}>{t.filters.offer_sent}</option>
              <option value={HIRE_STATUS.TERMINATED}>{t.filters.terminated}</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t.showing} <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredHires.length}</span> {t.hiresWord}
        </p>

        {/* Empty state */}
        {filteredHires.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {hasActiveFilters ? t.noResults : t.empty.title}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{hasActiveFilters ? '' : t.empty.description}</p>
            {!hasActiveFilters ? (
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                {t.empty.start}
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table (md+) */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.worker}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.salary}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.commission}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.hiredOn}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.status}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.payment}</th>
                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/60">
                  {filteredHires.map((hire) => {
                    const status = getStatusBadge(hire.status);
                    const payment = getPaymentBadge(hire);
                    const commission = getCommission(hire);
                    const key = hire.id || hire.hireId || hire.offerId;
                    return (
                      <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                        {/* Worker identity */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                              {hire.workerImage ? (
                                <img src={hire.workerImage} alt={hire.workerName} className="w-full h-full object-cover" />
                              ) : (
                                <User size={18} className="text-teal-600" />
                              )}
                              {hire.isPremium && (
                                <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                                  <Crown size={8} className="text-white" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 dark:text-white truncate">{hire.workerName || 'Unknown Worker'}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                                <Briefcase size={11} />
                                {hire.jobTitle || 'Service Provider'}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Salary */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-white">{formatCurrency(hire.salary)}</p>
                          <p className="text-xs text-gray-400">{t.salaryPerMonth}</p>
                        </td>
                        {/* Commission */}
                        <td className="px-4 py-3">
                          {commission != null ? (
                            <p className="font-medium text-teal-600">{formatCurrency(commission)} EGP</p>
                          ) : (
                            <p className="text-gray-400">-</p>
                          )}
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                            <Calendar size={13} className="text-gray-400" />
                            {formatDate(hire.createdAt || hire.startDate)}
                          </p>
                        </td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                            {status.icon}
                            {status.label}
                          </span>
                        </td>
                        {/* Payment */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${payment.className}`}>
                            <Wallet size={12} />
                            {payment.label}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleViewDetails(hire)}
                              className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition"
                              title={t.actions.view}
                            >
                              <Eye size={16} />
                            </button>
                            {canMessageOrTerminate(hire) && (
                              <>
                                <button
                                  onClick={() => handleSendMessage(hire)}
                                  disabled={creatingConversation}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition disabled:opacity-50"
                                  title={t.actions.message}
                                >
                                  {creatingConversation ? (
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <MessageCircle size={16} />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleTerminateClick(hire)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                                  title={t.actions.terminate}
                                >
                                  <XIcon size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards (< md) */}
            <div className="md:hidden space-y-3">
              {filteredHires.map((hire) => {
                const status = getStatusBadge(hire.status);
                const payment = getPaymentBadge(hire);
                const commission = getCommission(hire);
                const key = hire.id || hire.hireId || hire.offerId;
                return (
                  <div key={key} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    {/* Top: identity + status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                          {hire.workerImage ? (
                            <img src={hire.workerImage} alt={hire.workerName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={20} className="text-teal-600" />
                          )}
                          {hire.isPremium && (
                            <div className="absolute -bottom-0.5 -right-0.5 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                              <Crown size={8} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-white truncate">{hire.workerName || 'Unknown Worker'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <Briefcase size={11} />
                            {hire.jobTitle || 'Service Provider'}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border flex-shrink-0 ${status.className}`}>
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    {/* Middle: key facts */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t.table.salary}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatCurrency(hire.salary)}</p>
                        <p className="text-[10px] text-gray-400">{t.salaryPerMonth}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t.table.commission}</p>
                        <p className="text-sm font-semibold text-teal-600">{commission != null ? formatCurrency(commission) : '-'}</p>
                        <p className="text-[10px] text-gray-400">EGP</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t.table.payment}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border mt-0.5 ${payment.className}`}>
                          <Wallet size={10} />
                          {payment.label}
                        </span>
                      </div>
                    </div>

                    {/* Bottom: actions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatDate(hire.createdAt || hire.startDate)}
                      </p>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleViewDetails(hire)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition"
                          title={t.actions.view}
                        >
                          <Eye size={16} />
                        </button>
                        {canMessageOrTerminate(hire) && (
                          <>
                            <button
                              onClick={() => handleSendMessage(hire)}
                              disabled={creatingConversation}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition disabled:opacity-50"
                              title={t.actions.message}
                            >
                              {creatingConversation ? (
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <MessageCircle size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => handleTerminateClick(hire)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              title={t.actions.terminate}
                            >
                              <XIcon size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedHire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t.modal.title}</h2>
              <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden relative">
                  {selectedHire.workerImage ? (
                    <img src={selectedHire.workerImage} alt={selectedHire.workerName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-teal-600" />
                  )}
                  {selectedHire.isPremium && (
                    <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-0.5 border-2 border-white">
                      <Crown size={12} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">{selectedHire.workerName}</h3>
                    {selectedHire.isPremium && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                        <Crown size={10} className="text-yellow-500" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">{selectedHire.jobTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const s = getStatusBadge(selectedHire.status);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 border ${s.className}`}>
                          {s.icon}
                          {s.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.salary}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCurrency(selectedHire.salary)} {t.salaryPerMonth}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.commission}</p>
                  <p className="text-lg font-bold text-teal-600">{getCommission(selectedHire) != null ? `${formatCurrency(getCommission(selectedHire))} EGP` : '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.startDate}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedHire.startDate || selectedHire.createdAt)}</p>
                </div>
                {selectedHire.terminationDate && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.endDate}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedHire.terminationDate)}</p>
                  </div>
                )}
                {selectedHire.workerRating && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.modal.rating}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-1">
                      <StarIcon size={18} className="text-yellow-500" />
                      {selectedHire.workerRating}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t.modal.contact}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerEmail || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerLocation || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {canMessageOrTerminate(selectedHire) && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => handleSendMessage(selectedHire)}
                    disabled={creatingConversation}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingConversation ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <MessageCircle size={18} />
                    )}
                    {t.actions.message}
                  </button>
                  <button
                    onClick={() => handleTerminateClick(selectedHire)}
                    className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center justify-center gap-2"
                  >
                    <XIcon size={18} />
                    {t.actions.terminate}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {showTerminateModal && terminatingHire && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t.terminate.title}</h3>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{t.terminate.confirm}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.terminate.reason}
              </label>
              <textarea
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder={t.terminate.placeholder}
                rows="3"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTerminateModal(false)}
                disabled={terminating}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {t.terminate.cancel}
              </button>
              <button
                onClick={handleTerminateHire}
                disabled={terminating}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {terminating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {terminating ? t.terminate.processing : t.terminate.confirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyHires;
