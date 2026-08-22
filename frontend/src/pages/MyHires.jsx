// src/pages/MyHires.jsx - Employer hire management dashboard
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { isUserPremium } from '../utils/subscriptionService';
import hireService from '../services/hireService';
import employerEarningService from '../services/employerEarningService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import { UserDisplayName } from '../components/users';
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
import { formatCompensationAmount } from '../utils/compensationDisplay';
import RatingDialog from '../components/RatingDialog';
import { getRatingStatus, submitRating } from '../services/hireService';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

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

  // ============================================================
  // RATING — Phase 2 frontend integration
  // ============================================================
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingHireId, setRatingHireId] = useState(null);
  const [ratingStatus, setRatingStatus] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  // ============================================================
  // Work-period confirmation (Phase 2) state
  // ============================================================
  const [hireEarnings, setHireEarnings] = useState([]);
  const [hireEarningsLoading, setHireEarningsLoading] = useState(false);
  const [earningToReview, setEarningToReview] = useState(null);
  const [reviewAction, setReviewAction] = useState(null); // 'approve' | 'dispute'
  const [reviewReason, setReviewReason] = useState('');
  const [reviewInProgress, setReviewInProgress] = useState(false);

  const isPremium = useMemo(() => {
    const userId = authUser?.id || authUser?.email;
    return userId ? isUserPremium(userId) : false;
  }, [authUser]);


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
    loadHireEarnings(hire);
  };

  const handleCloseModal = () => {
    setShowDetailsModal(false);
    setSelectedHire(null);
    setHireEarnings([]);
  };

  // Fetch the earning periods attached to a hire (employer-owned).
  const loadHireEarnings = async (hire) => {
    const hireId = hire?.id || hire?.hireId;
    if (!hireId) {
      setHireEarnings([]);
      return;
    }
    setHireEarningsLoading(true);
    try {
      const data = await employerEarningService.getHireEarnings(hireId);
      setHireEarnings(Array.isArray(data.records) ? data.records : []);
    } catch (error) {
      console.error('Error loading hire earnings:', error);
      setHireEarnings([]);
    } finally {
      setHireEarningsLoading(false);
    }
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
      alert(t('myHiresPage.terminate.success'));
    } catch (error) {
      console.error('Error terminating hire:', error);
      alert(t('myHiresPage.terminate.error'));
    } finally {
      setTerminating(false);
    }
  };

  // ============================================================
  // WORK-PERIOD REVIEW HANDLERS (Phase 2)
  // ============================================================
  const openReview = (earning, action) => {
    setEarningToReview(earning);
    setReviewAction(action);
    setReviewReason('');
  };

  const closeReview = () => {
    setEarningToReview(null);
    setReviewAction(null);
    setReviewReason('');
  };

  const handleSubmitReview = async () => {
    if (!earningToReview || !selectedHire || reviewInProgress) return;

    const hireId = selectedHire.id || selectedHire.hireId;
    const earningId = earningToReview.id;
    setReviewInProgress(true);

    try {
      if (reviewAction === 'approve') {
        await employerEarningService.approveWorkerEarning(hireId, earningId);
      } else {
        await employerEarningService.disputeWorkerEarning(hireId, earningId, reviewReason.trim());
      }

      await loadHireEarnings(selectedHire);
      closeReview();
      alert(reviewAction === 'approve' ? t('myHiresPage.review.approved') : t('myHiresPage.review.disputed'));
    } catch (error) {
      console.error('Error reviewing work period:', error);
      const message = error?.response?.data?.message;
      alert(
        message === 'Only periods with confirmed payment can be approved' ||
          message === 'Only periods submitted for confirmation can be disputed' ||
          message === 'Only periods submitted for confirmation can be approved'
          ? t('myHiresPage.review.alreadyUpdated')
          : t('myHiresPage.review.error')
      );
      await loadHireEarnings(selectedHire);
    } finally {
      setReviewInProgress(false);
    }
  };

  const formatEarnedStatus = (status) => {
    const labels = {
      PENDING: t('myHiresPage.review.awaitingWorker'),
      AWAITING_CONFIRMATION: t('myHiresPage.review.awaitingEmployer'),
      EARNED: t('myHiresPage.review.confirmedBoth'),
      DISPUTED: t('myHiresPage.review.disputed'),
      CANCELLED: t('myHiresPage.review.cancelled'),
      ON_HOLD: t('myHiresPage.review.onHold')
    };
    return labels[status] || t('myHiresPage.status.unknown');
  };

  const handleSendMessage = async (hire) => {
    if (!hire) return;

    const workerId = hire.workerId;
    const workerName = hire.workerName || 'Worker';

    if (!workerId) {
      alert(t('myHiresPage.workerIdNotFound'));
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
  // RATING HANDLERS — Phase 2
  // ============================================================
  const openRatingDialog = async (hire) => {
    const hireId = hire.id || hire.hireId;
    if (!hireId) return;
    setRatingHireId(hireId);
    setRatingDialogOpen(true);
    setRatingLoading(true);
    setRatingStatus(null);
    try {
      const status = await getRatingStatus(hireId);
      setRatingStatus(status);
    } catch (error) {
      console.error('Error loading rating status:', error);
      setRatingStatus({ canRate: false, hasRated: false, reason: 'LOAD_FAILED' });
    } finally {
      setRatingLoading(false);
    }
  };

  const closeRatingDialog = () => {
    if (ratingSubmitting) return;
    setRatingDialogOpen(false);
    setRatingHireId(null);
    setRatingStatus(null);
  };

  const handleSubmitRating = async (stars) => {
    if (!ratingHireId || ratingSubmitting) return;
    setRatingSubmitting(true);
    try {
      const result = await submitRating(ratingHireId, stars);
      if (result?.success) {
        setRatingStatus(prev => ({ ...prev, canRate: false, hasRated: true }));
        alert(t('rating.ratingUpdated'));
        setRatingDialogOpen(false);
        setRatingHireId(null);
      } else {
        alert(t('rating.ratingError'));
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || t('rating.ratingError');
      if (message === 'You have already rated this hire' || error?.response?.data?.code === 'REVIEW_EXISTS') {
        setRatingStatus(prev => ({ ...prev, canRate: false, hasRated: true }));
        alert(t('rating.alreadyRated'));
        setRatingDialogOpen(false);
        setRatingHireId(null);
      } else {
        alert(t('rating.ratingError'));
      }
    } finally {
      setRatingSubmitting(false);
    }
  };

  // Auto-load rating status when the selected hire changes in the modal.
  useEffect(() => {
    if (!selectedHire?.id) return;
    const hireId = selectedHire.id || selectedHire.hireId;
    if (!hireId) return;

    if (ratingDialogOpen && ratingHireId !== hireId) {
      closeRatingDialog();
    }

    setRatingHireId(hireId);
    setRatingLoading(true);
    setRatingStatus(null);

    getRatingStatus(hireId)
      .then(setRatingStatus)
      .catch(() => setRatingStatus({ canRate: false, hasRated: false, reason: 'LOAD_FAILED' }))
      .finally(() => setRatingLoading(false));
  }, [selectedHire?.id]);

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
      label: t(`myHiresPage.status.${canonical}`, { defaultValue: t('myHiresPage.status.unknown') })
    };
  };

  const getPaymentBadge = (hire) => {
    const ps = (hire.paymentStatus || '').toLowerCase();
    if (ps === 'completed' || ps === 'confirmed' || ps === 'paid') {
      return { className: 'bg-green-50 text-green-700 border-green-200', label: t('myHiresPage.payment.homelyServFeePaid') };
    }
    if (ps === 'pending' || ps === 'processing') {
      return { className: 'bg-amber-50 text-amber-700 border-amber-200', label: t('myHiresPage.payment.pending') };
    }
    return { className: 'bg-gray-100 text-gray-600 border-gray-200', label: t('myHiresPage.payment.unpaid') };
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
  const formatEarningAmount = (earning) => {
    const amount = Number(earning?.amount);
    if (!Number.isFinite(amount)) return '—';
    const currency = earning?.currency == null
      ? 'EGP'
      : (typeof earning.currency === 'string' && /^[A-Z]{3}$/i.test(earning.currency.trim())
        ? earning.currency.trim().toUpperCase()
        : null);
    return currency ? `${amount.toLocaleString()} ${currency}` : '—';
  };

  const getCommission = (hire) => hire.commissionAmount ?? hire.totalDue ?? null;
  const getAgreedSalary = (hire) => hire.agreedSalary ?? hire.salary;

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
  if (authLoading && !authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('myHiresPage.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  const statCards = [
    { key: 'total', label: t('myHiresPage.stats.total'), value: stats.total, icon: Users, color: 'teal' },
    { key: 'active', label: t('myHiresPage.stats.active'), value: stats.active, icon: CheckCircle, color: 'green' },
    { key: 'awaitingPayment', label: t('myHiresPage.stats.awaitingPayment'), value: stats.awaitingPayment, icon: Clock, color: 'amber' },
    { key: 'terminated', label: t('myHiresPage.stats.terminated'), value: stats.terminated, icon: XIcon, color: 'red' }
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
        title={t('myHiresPage.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={isPremium}
        rightContent={
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
          >
            <RefreshCw size={16} />
            {t('myHiresPage.refresh')}
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-6">
        <RolePageHeader
          title={t('myHiresPage.title')}
          subtitle={t('myHiresPage.subtitle')}
          actions={
            <div className="flex items-center gap-2 text-sm text-teal-100">
              <Users size={16} className="flex-shrink-0" />
              <span className="font-medium text-white">{stats.total}</span>
              <span>{t('myHiresPage.hiresWord')}</span>
            </div>
          }
        />

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
                placeholder={t('myHiresPage.searchPlaceholder')}
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
              <option value="all">{t('myHiresPage.filters.all')}</option>
              <option value={HIRE_STATUS.ACTIVE}>{t('myHiresPage.filters.active')}</option>
              <option value={HIRE_STATUS.OFFER_SENT}>{t('myHiresPage.filters.offer_sent')}</option>
              <option value={HIRE_STATUS.TERMINATED}>{t('myHiresPage.filters.terminated')}</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
              >
                {t('myHiresPage.clearFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('myHiresPage.showing')} <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredHires.length}</span> {t('myHiresPage.hiresWord')}
        </p>

        {/* Empty state */}
        {filteredHires.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              {hasActiveFilters ? t('myHiresPage.noResults') : t('myHiresPage.empty.title')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{hasActiveFilters ? '' : t('myHiresPage.empty.description')}</p>
            {!hasActiveFilters ? (
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('myHiresPage.empty.start')}
              </button>
            ) : (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {t('myHiresPage.clearFilters')}
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
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.worker')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.salary')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.commission')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.hiredOn')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.status')}</th>
                    <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.payment')}</th>
                    <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide px-4 py-3">{t('myHiresPage.table.actions')}</th>
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
                              <UserDisplayName name={hire.workerName || t('myHiresPage.fallbacks.unknownWorker')} role="WORKER" isPremium={hire.workerIsPremium} size="lg" />
                              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                                <Briefcase size={11} />
                                {hire.jobTitle || t('myHiresPage.fallbacks.serviceProvider')}
                              </p>
                            </div>
                          </div>
                        </td>
                        {/* Salary */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800 dark:text-white">{formatCompensationAmount(getAgreedSalary(hire), hire)}</p>
                          <p className="text-xs text-gray-400">{t('workerOffers.perMonth')}</p>
                        </td>
                        {/* Commission */}
                        <td className="px-4 py-3">
                          {commission != null ? (
                            <p className="font-medium text-teal-600">{formatCompensationAmount(commission, hire)}</p>
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
                              title={t('myHiresPage.actions.view')}
                            >
                              <Eye size={16} />
                            </button>
                            {canMessageOrTerminate(hire) && (
                              <>
                                <button
                                  onClick={() => handleSendMessage(hire)}
                                  disabled={creatingConversation}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition disabled:opacity-50"
                                  title={t('myHiresPage.actions.message')}
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
                                  title={t('myHiresPage.actions.terminate')}
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
                          <UserDisplayName name={hire.workerName || t('myHiresPage.fallbacks.unknownWorker')} role="WORKER" isPremium={hire.workerIsPremium} size="lg" />
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                            <Briefcase size={11} />
                            {hire.jobTitle || t('myHiresPage.fallbacks.serviceProvider')}
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
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t('myHiresPage.table.salary')}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{formatCompensationAmount(getAgreedSalary(hire), hire)}</p>
                        <p className="text-[10px] text-gray-400">{t('workerOffers.perMonth')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t('myHiresPage.table.commission')}</p>
                        <p className="text-sm font-semibold text-teal-600">{commission != null ? formatCompensationAmount(commission, hire) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-400">{t('myHiresPage.table.payment')}</p>
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
                          title={t('myHiresPage.actions.view')}
                        >
                          <Eye size={16} />
                        </button>
                        {canMessageOrTerminate(hire) && (
                          <>
                            <button
                              onClick={() => handleSendMessage(hire)}
                              disabled={creatingConversation}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition disabled:opacity-50"
                              title={t('myHiresPage.actions.message')}
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
                              title={t('myHiresPage.actions.terminate')}
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">{t('myHiresPage.modal.title')}</h2>
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
                    <UserDisplayName name={selectedHire.workerName} role="WORKER" isPremium={selectedHire.workerIsPremium} size="xl" />
                    {selectedHire.isPremium && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-50 border border-yellow-200 rounded-full text-[10px] font-medium text-yellow-700">
                        <Crown size={10} className="text-yellow-500" />
                        {t('myHiresPage.premium')}
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('myHiresPage.modal.salary')}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatCompensationAmount(getAgreedSalary(selectedHire), selectedHire)}{t('workerOffers.perMonth')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('myHiresPage.modal.commission')}</p>
                  <p className="text-lg font-bold text-teal-600">{getCommission(selectedHire) != null ? formatCompensationAmount(getCommission(selectedHire), selectedHire) : '-'}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('myHiresPage.modal.startDate')}</p>
                  <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedHire.startDate || selectedHire.createdAt)}</p>
                </div>
                {selectedHire.terminationDate && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('myHiresPage.modal.endDate')}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white">{formatDate(selectedHire.terminationDate)}</p>
                  </div>
                )}
                {selectedHire.workerRating && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('myHiresPage.modal.rating')}</p>
                    <p className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-1">
                      <StarIcon size={18} className="text-yellow-500" />
                      {selectedHire.workerRating}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('myHiresPage.modal.contact')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerEmail || t('myHiresPage.notProvided')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerPhone || t('myHiresPage.notProvided')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-300">{selectedHire.workerLocation || t('myHiresPage.notSpecified')}</span>
                  </div>
                </div>
              </div>

              {/* Rating Section — Phase 2 */}
              <div className="mt-6 p-4 border border-teal-100 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-900/10 rounded-xl">
                <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <StarIcon size={16} className="text-yellow-500" />
                  {t('rating.title')}
                </h4>

                {ratingLoading && selectedHire.id === ratingHireId ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('myHiresPage.review.loading')}</p>
                ) : ratingStatus && selectedHire.id === ratingHireId ? (
                  <div className="mt-3">
                    {ratingStatus.hasRated ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                        <CheckCircle size={16} />
                        {t('rating.rated')}
                      </div>
                    ) : ratingStatus.canRate ? (
                      <button
                        onClick={() => openRatingDialog(selectedHire)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
                      >
                        <StarIcon size={16} />
                        {t('rating.rateWorker')}
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ratingStatus.reason === 'HIRE_NOT_ACTIVE' && t('rating.hireNotActive')}
                        {ratingStatus.reason === 'PAYMENT_NOT_CONFIRMED' && t('rating.paymentNotConfirmed')}
                        {ratingStatus.reason === 'WORK_PERIOD_NOT_CONFIRMED' && t('rating.offerNotCompleted')}
                        {ratingStatus.reason === 'LOAD_FAILED' && t('rating.ratingError')}
                        {!ratingStatus.reason && t('rating.noRating')}
                      </p>
                    )}
                  </div>
                ) : null}
              </div>

              {canMessageOrTerminate(selectedHire) && (
                <div className="mt-6 p-4 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-900/10 rounded-xl">
                  <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <CheckCircle size={16} className="text-indigo-500" />
                    {t('myHiresPage.review.title')}
                  </h4>

                  {hireEarningsLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('myHiresPage.review.loading')}</p>
                  ) : hireEarnings.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('myHiresPage.review.empty')}</p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {hireEarnings.map((earning) => {
                        const isAwaiting = earning.status === 'AWAITING_CONFIRMATION';
                        return (
                          <div
                            key={earning.id}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-white dark:bg-gray-800 border ${
                              isAwaiting
                                ? 'border-indigo-200 dark:border-indigo-800'
                                : 'border-gray-100 dark:border-gray-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 dark:text-white text-sm">
                                  {formatEarningAmount(earning)}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                                  isAwaiting
                                    ? 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-800'
                                    : earning.status === 'EARNED'
                                      ? 'bg-green-100 text-green-700 border-green-200'
                                      : earning.status === 'DISPUTED'
                                        ? 'bg-red-100 text-red-700 border-red-200'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                  {formatEarnedStatus(earning.status)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {t('myHiresPage.review.period')}: {new Date(earning.periodStart || earning.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {earning.periodEnd ? ` – ${new Date(earning.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                              </p>
                            </div>

                            {isAwaiting && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openReview(earning, 'approve')}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition inline-flex items-center gap-1.5"
                                >
                                  <CheckCircle size={13} />
                                  {t('myHiresPage.review.approveButton')}
                                </button>
                                <button
                                  onClick={() => openReview(earning, 'dispute')}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition inline-flex items-center gap-1.5"
                                >
                                  <AlertTriangle size={13} />
                                  {t('myHiresPage.review.disputeButton')}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    {t('myHiresPage.review.explanation')}
                  </p>
                </div>
              )}

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
                    {t('myHiresPage.actions.message')}
                  </button>
                  <button
                    onClick={() => handleTerminateClick(selectedHire)}
                    className="flex-1 px-4 py-2 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center justify-center gap-2"
                  >
                    <XIcon size={18} />
                    {t('myHiresPage.actions.terminate')}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">{t('myHiresPage.terminate.title')}</h3>
              <button
                onClick={() => setShowTerminateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{t('myHiresPage.terminate.confirm')}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('myHiresPage.terminate.reason')}
              </label>
              <textarea
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder={t('myHiresPage.terminate.placeholder')}
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
                {t('myHiresPage.terminate.cancel')}
              </button>
              <button
                onClick={handleTerminateHire}
                disabled={terminating}
                className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg font-medium text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {terminating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {terminating ? t('myHiresPage.terminate.processing') : t('myHiresPage.terminate.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Work-period Review Modal (approve / dispute) */}
      {earningToReview && reviewAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[85dvh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {reviewAction === 'approve' ? t('myHiresPage.review.approveTitle') : t('myHiresPage.review.disputeTitle')}
              </h3>
              <button
                onClick={closeReview}
                disabled={reviewInProgress}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
              {reviewAction === 'approve' ? t('myHiresPage.review.approveBody') : t('myHiresPage.review.disputeBody')}
            </p>

            {reviewAction === 'dispute' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('myHiresPage.review.reasonLabel')}
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder={t('myHiresPage.review.reasonPlaceholder')}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeReview}
                disabled={reviewInProgress}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                {t('myHiresPage.review.cancel')}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewInProgress}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-white transition disabled:opacity-50 flex items-center justify-center gap-2 ${
                  reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewInProgress && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {reviewInProgress
                  ? t('myHiresPage.review.processing')
                  : reviewAction === 'approve'
                    ? t('myHiresPage.review.confirmApprove')
                    : t('myHiresPage.review.confirmDispute')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Dialog — Phase 2 */}
      <RatingDialog
        open={ratingDialogOpen}
        onClose={closeRatingDialog}
        title={t('rating.rateWorker')}
        onSubmit={handleSubmitRating}
        loading={ratingSubmitting}
      />
    </DashboardLayout>
  );
};

export default MyHires;
