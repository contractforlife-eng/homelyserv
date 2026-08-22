// src/pages/AdminPayments.jsx - BACKEND CONNECTED
// Fetches real payment data from GET /api/admin/payments.
// No localStorage. No fake data.
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
import { getManualPaymentProof, confirmManualPayment, rejectManualPayment } from '../services/paymentService';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import PageLoader from '../components/common/PageLoader';
import { UserAvatar } from '../components/users';
import {
  CreditCard,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  RefreshCw,
  User as UserIcon,
  UserCheck,
  DollarSign,
  Smartphone,
  Building2,
  ExternalLink,
  FileCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

// ============================================================
// MAIN ADMIN PAYMENTS COMPONENT
// ============================================================
const AdminPayments = () => {
  const { t: i18nT } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);

  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [completedRevenueByCurrency, setCompletedRevenueByCurrency] = useState([]);
  const [paypalSandboxRefundsEnabled, setPaypalSandboxRefundsEnabled] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [language, setLanguage] = useState('en');
  const [proofUrl, setProofUrl] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);
  }, []);

  // ============================================================
  // LOAD PAYMENTS FROM BACKEND
  // ============================================================
  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/payments');
      if (response.data?.success) {
        const fetched = response.data.payments || [];
        setPayments(fetched);
        setFilteredPayments(fetched);
        setCompletedRevenueByCurrency(response.data.completedRevenueByCurrency || []);
        setPaypalSandboxRefundsEnabled(response.data.paypalSandboxRefundsEnabled === true);
      } else {
        setError(response.data?.message || i18nT('adminPayments.loadFailed'));
      }
    } catch (err) {
      console.error('❌ Error loading payments:', err);
      setError(err.response?.data?.message || i18nT('adminPayments.loadFailed'));
      setPayments([]);
      setFilteredPayments([]);
      setCompletedRevenueByCurrency([]);
      setPaypalSandboxRefundsEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [i18nT]);

  const canRefund = (payment) => (
    paypalSandboxRefundsEnabled
    && payment?.status === 'completed'
    && String(payment?.paymentMethod || '').toLowerCase() === 'paypal'
    && payment?.captureId
    && payment?.providerAmount
    && payment?.providerCurrency
    && payment?.reconciliation?.state === 'MATCHED'
    && (payment?.refunds || []).length === 0
  );

  const requestFullRefund = async (payment) => {
    const book = formatCurrency(payment.amount, payment);
    const provider = formatCurrency(payment.providerAmount, { currency: payment.providerCurrency });
    if (!window.confirm(i18nT('adminPayments.refundConfirm', { provider, book }))) return;
    const reason = window.prompt(i18nT('adminPayments.refundReasonPrompt'))?.trim();
    if (!reason) return;
    setRefunding(true);
    setError(null);
    try {
      await api.post(`/api/admin/payments/${payment.id}/refunds`, { reason });
      setShowDetailsModal(false);
      setSelectedPayment(null);
      await loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || i18nT('adminPayments.refundFailed'));
    } finally {
      setRefunding(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }
    if (authUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadPayments();
  }, [authUser, isAuthenticated, authLoading, navigate, loadPayments]);

  // ============================================================
  // FILTER PAYMENTS
  // ============================================================
  useEffect(() => {
    let filtered = payments;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((p) =>
        p.id?.toLowerCase().includes(lower) ||
        p.transactionId?.toLowerCase().includes(lower) ||
        p.orderId?.toLowerCase().includes(lower) ||
        p.User?.fullName?.toLowerCase().includes(lower) ||
        p.employerName?.toLowerCase().includes(lower) ||
        p.workerName?.toLowerCase().includes(lower) ||
        p.userEmail?.toLowerCase().includes(lower) ||
        p.paymentMethod?.toLowerCase().includes(lower)
      );
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, searchTerm]);

  // ============================================================
  // HELPERS
  // ============================================================
  const getStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-500/20 text-green-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      pending_verification: 'bg-blue-500/20 text-blue-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending': return <Clock size={16} className="text-yellow-400" />;
      case 'processing': return <Clock size={16} className="text-blue-400" />;
      case 'pending_verification': return <Clock size={16} className="text-blue-400" />;
      case 'failed': return <AlertCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const getStatusLabel = (status) => {
    return i18nT(`adminPayments.status.${status || 'unknown'}`, { defaultValue: i18nT('adminPayments.status.unknown') });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount, payment) => {
    const numericAmount = typeof amount === 'number' ? amount : Number(amount);
    if (!Number.isFinite(numericAmount)) return '—';
    const currency = typeof payment?.currency === 'string' && /^[A-Z]{3}$/i.test(payment.currency.trim())
      ? payment.currency.trim().toUpperCase()
      : 'UNKNOWN';
    return `${numericAmount.toLocaleString()} ${currency}`;
  };

  const getPayerName = (p) => p.User?.fullName || p.employerName || p.userEmail || i18nT('adminPayments.unknown');

  const MANUAL_PROVIDERS = new Set(['vodafone_cash', 'instapay', 'bank_transfer']);
  const isManualPayment = (payment) => MANUAL_PROVIDERS.has(String(payment?.paymentMethod || '').toLowerCase());

  const getManualReviewStatusColor = (manualReviewState) => {
    const colors = {
      awaiting_transfer: 'bg-gray-500/20 text-gray-400',
      pending_verification: 'bg-orange-500/20 text-orange-400',
      verified: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
    };
    return colors[manualReviewState] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getManualReviewStatusIcon = (manualReviewState) => {
    switch (manualReviewState) {
      case 'verified': return <CheckCircle size={16} className="text-green-400" />;
      case 'pending_verification': return <Clock size={16} className="text-orange-400" />;
      case 'awaiting_transfer': return <Clock size={16} className="text-gray-400" />;
      case 'rejected': return <AlertCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400 dark:text-gray-500" />;
    }
  };

  const getManualReviewStatusLabel = (manualReviewState) => {
    const labels = {
      awaiting_transfer: i18nT('adminManualReview.status.awaitingTransfer'),
      pending_verification: i18nT('adminManualReview.status.pendingVerification'),
      verified: i18nT('adminManualReview.status.verified'),
      rejected: i18nT('adminManualReview.status.rejected'),
    };
    return labels[manualReviewState] || i18nT('adminManualReview.status.unknown');
  };

  const getFulfillmentStatusLabel = (fulfillmentStatus) => {
    const labels = {
      pending: i18nT('adminManualReview.fulfillment.pending'),
      completed: i18nT('adminManualReview.fulfillment.completed'),
      failed: i18nT('adminManualReview.fulfillment.failed'),
    };
    return labels[fulfillmentStatus] || fulfillmentStatus || i18nT('adminManualReview.fulfillment.unknown');
  };

  const getFulfillmentStatusColor = (fulfillmentStatus) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      failed: 'bg-red-500/20 text-red-400',
    };
    return colors[fulfillmentStatus] || 'bg-gray-500/20 text-gray-400 dark:text-gray-500';
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      vodafone_cash: i18nT('manualPayment.vodafoneCash'),
      instapay: i18nT('manualPayment.instapay'),
      bank_transfer: i18nT('bankTransfer.category'),
      paypal: 'PayPal',
      paymob: 'Paymob',
    };
    return labels[method] || method || i18nT('adminPayments.notAvailable');
  };

  const getPaymentMethodIcon = (method) => {
    if (method === 'vodafone_cash') return Smartphone;
    if (method === 'instapay') return Building2;
    if (method === 'bank_transfer') return Building2;
    return null;
  };

  const handleViewProof = async (payment) => {
    setProofLoading(true);
    setProofError(null);
    setProofUrl(null);
    try {
      const result = await getManualPaymentProof(payment.id);
      if (result.success && result.proof?.signedUrl) {
        setProofUrl(result.proof.signedUrl);
      } else {
        setProofError(result.error || i18nT('adminManualReview.proof.loadFailed'));
      }
    } catch (err) {
      setProofError(err.response?.data?.error || i18nT('adminManualReview.proof.loadFailed'));
    } finally {
      setProofLoading(false);
    }
  };

  const handleConfirm = async (payment) => {
    const confirmed = window.confirm(i18nT('adminManualReview.confirmDialog'));
    if (!confirmed) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmManualPayment(payment.id);
      if (result.success) {
        await loadPayments();
        setShowDetailsModal(false);
        setSelectedPayment(null);
      } else {
        setError(result.error || i18nT('adminManualReview.confirmFailed'));
      }
    } catch (err) {
      setError(err.response?.data?.error || i18nT('adminManualReview.confirmFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const handleReject = async (payment) => {
    setRejectionError(null);
    const trimmed = rejectionReason.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 500) {
      setRejectionError(i18nT('adminManualReview.rejectReasonRequired'));
      return;
    }
    setRejecting(true);
    setError(null);
    try {
      const result = await rejectManualPayment(payment.id, trimmed);
      if (result.success) {
        await loadPayments();
        setShowDetailsModal(false);
        setSelectedPayment(null);
        setRejectionReason('');
      } else {
        setError(result.error || i18nT('adminManualReview.rejectFailed'));
      }
    } catch (err) {
      setError(err.response?.data?.error || i18nT('adminManualReview.rejectFailed'));
    } finally {
      setRejecting(false);
    }
  };

  const handleRetryFulfillment = async (payment) => {
    setConfirming(true);
    setError(null);
    try {
      const result = await confirmManualPayment(payment.id);
      if (result.success) {
        await loadPayments();
        setShowDetailsModal(false);
        setSelectedPayment(null);
      } else {
        setError(result.error || i18nT('adminManualReview.retryFailed'));
      }
    } catch (err) {
      setError(err.response?.data?.error || i18nT('adminManualReview.retryFailed'));
    } finally {
      setConfirming(false);
    }
  };

  const stats = {
    total: payments.length,
    completed: payments.filter((p) => p.status === 'completed').length,
    pending: payments.filter((p) => ['pending', 'processing', 'pending_verification'].includes(p.status)).length,
    failed: payments.filter((p) => p.status === 'failed').length,
  };

  const formattedCompletedRevenue = completedRevenueByCurrency.length
    ? completedRevenueByCurrency.map((entry) => formatCurrency(entry.amount, entry)).join(' · ')
    : '—';
  const entitlementImpactLabel = (impact) => ({
    ACTIVE: i18nT('subscriptionRefundAudit.active'),
    REVERSED: i18nT('subscriptionRefundAudit.reversed'),
    REFUND_PENDING: i18nT('subscriptionRefundAudit.refundPending'),
    REFUNDED_ENTITLEMENT_ACTIVE: i18nT('subscriptionRefundAudit.refundedActive'),
    REFUNDED_ENTITLEMENT_REVERSED: i18nT('subscriptionRefundAudit.refundedReversed'),
    REVIEW_REQUIRED: i18nT('subscriptionRefundAudit.review'),
    NONE: i18nT('subscriptionRefundAudit.none'),
  }[impact] || i18nT('subscriptionRefundAudit.review'));

  // ============================================================
  // RENDER
  // ============================================================
  // Only block during initial unresolved authentication
  // After auth resolves, render the page shell immediately
  if (authLoading && !authUser) {
    return <PageLoader text={i18nT('adminPayments.loading')} fullScreen />;
  }

  if (!authUser) return null;

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={i18nT('adminPayments.title')}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">{i18nT('adminPayments.title')}</h1>
              <p className="text-black/70 mt-1">{i18nT('adminPayments.subtitle')}</p>
            </div>
            <button
              onClick={loadPayments}
              className="bg-black/20 hover:bg-black/30 text-black px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              {i18nT('adminPayments.refresh')}
            </button>
          </div>
        </div>

        {/* Stats Cards - skeleton on initial load, real data after */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 animate-pulse">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
                <div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminPayments.total')}</p>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminPayments.status.completed')}</p>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminPayments.status.pending')}</p>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <Clock size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminFinancial.grossCompletedByCurrency')}</p>
                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-yellow-400" />
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{formattedCompletedRevenue}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder={i18nT('adminPayments.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="all">{i18nT('adminPayments.all')}</option>
                <option value="completed">{i18nT('adminPayments.status.completed')}</option>
                <option value="pending">{i18nT('adminPayments.status.pending')}</option>
                <option value="processing">{i18nT('adminPayments.status.processing')}</option>
                <option value="failed">{i18nT('adminPayments.status.failed')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {i18nT('adminPayments.showing', { count: filteredPayments.length })}
          </p>
        </div>

        {/* Payments List - inline loading/error states */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">{i18nT('adminPayments.loading')}</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-red-500/20">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{i18nT('adminPayments.loadFailed')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadPayments}
              className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition inline-flex items-center gap-2 font-medium"
            >
              <RefreshCw size={16} />
              {i18nT('adminPayments.retry')}
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={i18nT('adminPayments.emptyTitle')}
            description={i18nT('adminPayments.emptyDescription')}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-yellow-500/20">
                  <tr>
                    {['payer','amount','type','statusLabel','date','actions'].map((key) => <th key={key} className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{i18nT(`adminPayments.${key}`)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-500/10">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-yellow-500/5 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            name={getPayerName(payment)}
                            image={payment.User?.profileImage || null}
                            role={payment.User?.role}
                            size="sm"
                            className="border border-yellow-500/30"
                          />
                          <span className="text-sm text-gray-900 dark:text-white font-medium truncate">{getPayerName(payment)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{formatCurrency(payment.amount, payment)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 capitalize flex items-center gap-2">
                        {isManualPayment(payment) && (() => {
                          const Icon = getPaymentMethodIcon(payment.paymentMethod);
                          return Icon ? <Icon size={14} className="text-yellow-500" /> : null;
                        })()}
                        {getPaymentMethodLabel(payment.paymentMethod)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            {getStatusLabel(payment.status)}
                          </span>
                          {isManualPayment(payment) && payment.manualReviewState && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getManualReviewStatusColor(payment.manualReviewState)}`}>
                              {getManualReviewStatusIcon(payment.manualReviewState)}
                              {getManualReviewStatusLabel(payment.manualReviewState)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedPayment(payment); setShowDetailsModal(true); }}
                          className="px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition flex items-center gap-1"
                        >
                          <Eye size={12} />
                          {i18nT('adminPayments.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{i18nT('adminPayments.details')}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminPayments.transactionId')}</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white break-all">{selectedPayment.transactionId || selectedPayment.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 flex-shrink-0 ${getStatusColor(selectedPayment.status)}`}>
                    {getStatusIcon(selectedPayment.status)}
                    {getStatusLabel(selectedPayment.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <UserCheck size={16} className="text-yellow-500" />
                    {i18nT('adminPayments.payer')}
                  </h3>
                  <p className="font-medium text-gray-900 dark:text-white">{getPayerName(selectedPayment)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedPayment.userEmail || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    {i18nT('adminPayments.worker')}
                  </h3>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.workerName || 'N/A'}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedPayment.jobTitle || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminFinancial.transactionAmount')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(selectedPayment.amount, selectedPayment)}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminFinancial.providerCharge')}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedPayment.providerAmount && selectedPayment.providerCurrency
                      ? formatCurrency(selectedPayment.providerAmount, { currency: selectedPayment.providerCurrency })
                      : '—'}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminPayments.date')}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.createdAt)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">{i18nT('adminPayments.method')}: {selectedPayment.paymentMethod || i18nT('adminPayments.notAvailable')}</p>
                </div>
              </div>

              {selectedPayment.subscriptionReconciliation && (
                <div className="mt-6 bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{i18nT('subscriptionRefundAudit.title')}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {entitlementImpactLabel(selectedPayment.subscriptionReconciliation.entitlementImpact)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedPayment.subscriptionReconciliation.grantPresent
                      ? `${i18nT('subscriptionRefundAudit.grant')}: ${i18nT(`staffSubscription.plans.${selectedPayment.subscriptionReconciliation.grantPlan}`, { defaultValue: i18nT('staffSubscription.plans.legacy_unknown') })} · ${selectedPayment.subscriptionReconciliation.grantDurationDays} ${i18nT('subscriptionRefundAudit.days')}`
                      : i18nT('subscriptionRefundAudit.noGrant')}
                  </p>
                </div>
              )}

              {isManualPayment(selectedPayment) && (
                <div className="mt-6 bg-blue-500/10 border border-blue-500/25 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileCheck size={18} className="text-blue-400" />
                    {i18nT('adminManualReview.title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedPayment.paymentMethod === 'bank_transfer' && selectedPayment.metadata?.canonicalAmount && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('bankTransfer.canonicalAmount')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.metadata.canonicalAmount} {selectedPayment.metadata.canonicalCurrency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminFinancial.transactionAmount')}</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.amount} {selectedPayment.currency}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">FX rate / source</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.metadata.exchangeRate} · {selectedPayment.metadata.exchangeRateSource}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">FX version / effective</p>
                          <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.metadata.exchangeRateVersion} · {selectedPayment.metadata.exchangeRateTimestamp}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.paymentReference')}</p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">{selectedPayment.manualPaymentReference || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.externalReference')}</p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white break-all">{selectedPayment.externalTransactionReference || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.submittedAt')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.submittedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.reviewedBy')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedPayment.reviewedBy || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.reviewedAt')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.reviewedAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.manualReviewStatus')}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getManualReviewStatusColor(selectedPayment.manualReviewState)}`}>
                        {getManualReviewStatusIcon(selectedPayment.manualReviewState)}
                        {getManualReviewStatusLabel(selectedPayment.manualReviewState)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.fulfillmentStatus')}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getFulfillmentStatusColor(selectedPayment.fulfillmentStatus)}`}>
                        {getFulfillmentStatusLabel(selectedPayment.fulfillmentStatus)}
                      </span>
                    </div>
                    {selectedPayment.rejectionReason && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{i18nT('adminManualReview.rejectionReason')}</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{selectedPayment.rejectionReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {selectedPayment.proofStorageKey && (
                      <button
                        onClick={() => handleViewProof(selectedPayment)}
                        disabled={proofLoading}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                      >
                        {proofLoading ? <RefreshCw size={14} className="animate-spin" /> : <Eye size={14} />}
                        {i18nT('adminManualReview.viewProof')}
                      </button>
                    )}
                    {selectedPayment.manualReviewState === 'pending_verification' && (
                      <>
                        <button
                          onClick={() => handleConfirm(selectedPayment)}
                          disabled={confirming || rejecting}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                        >
                          {confirming ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          {i18nT('adminManualReview.confirmPayment')}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          disabled={confirming || rejecting}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                        >
                          <X size={14} />
                          {i18nT('adminManualReview.rejectPayment')}
                        </button>
                      </>
                    )}
                    {selectedPayment.manualReviewState === 'verified' && selectedPayment.fulfillmentStatus === 'failed' && (
                      <button
                        onClick={() => handleRetryFulfillment(selectedPayment)}
                        disabled={confirming || rejecting}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                      >
                        <RotateCcw size={14} />
                        {i18nT('adminManualReview.retryFulfillment')}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(selectedPayment.refunds || []).length > 0 && (
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{i18nT('adminPayments.refundHistory')}</h3>
                  <div className="mt-3 space-y-3">
                    {selectedPayment.refunds.map((refund) => (
                      <div key={refund.id} className="text-sm border-t border-gray-200 dark:border-gray-600 pt-3 first:border-0 first:pt-0">
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{refund.type?.toLowerCase()} · {refund.status}</p>
                        <p className="text-gray-600 dark:text-gray-300">{i18nT('adminPayments.book')}: {formatCurrency(refund.bookAmount, { currency: refund.bookCurrency })}</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          {i18nT('adminPayments.provider')}: {formatCurrency(refund.providerAmount || refund.requestedProviderAmount, { currency: refund.providerCurrency })}
                        </p>
                        {refund.reason && <p className="text-gray-500 dark:text-gray-400">{i18nT('adminPayments.reason')}: {refund.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                {canRefund(selectedPayment) && (
                  <button
                    onClick={() => requestFullRefund(selectedPayment)}
                    disabled={refunding}
                    className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                  >
                    {refunding ? i18nT('adminPayments.refunding') : i18nT('adminPayments.sandboxRefund')}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  {i18nT('adminPayments.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Modal */}
      {proofUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setProofUrl(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-yellow-500/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-yellow-500/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{i18nT('adminManualReview.proof.title')}</h3>
              <button
                onClick={() => setProofUrl(null)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[80vh]">
              {proofError ? (
                <div className="text-center py-8">
                  <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">{proofError}</p>
                </div>
              ) : (
                <img src={proofUrl} alt="Payment proof" className="w-full h-auto rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20">
            <div className="flex items-center justify-between p-6 border-b border-yellow-500/20">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{i18nT('adminManualReview.rejectPayment')}</h3>
              <button
                onClick={() => { setShowRejectModal(false); setRejectionError(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{i18nT('adminManualReview.rejectReasonLabel')}</p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={i18nT('adminManualReview.rejectReasonPlaceholder')}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{rejectionReason.length}/500</p>
              {rejectionError && (
                <p className="text-sm text-red-600 mt-2">{rejectionError}</p>
              )}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionError(null); }}
                  disabled={rejecting}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  {i18nT('adminManualReview.cancel')}
                </button>
                <button
                  onClick={() => handleReject(selectedPayment)}
                  disabled={rejecting}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
                >
                  {rejecting ? i18nT('adminManualReview.rejecting') : i18nT('adminManualReview.rejectPayment')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminPayments;
