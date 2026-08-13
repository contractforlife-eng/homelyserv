// src/pages/AdminPayments.jsx - BACKEND CONNECTED
// Fetches real payment data from GET /api/admin/payments.
// No localStorage. No fake data.
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../utils/api';
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
        setError(response.data?.message || 'Failed to load payments');
      }
    } catch (err) {
      console.error('❌ Error loading payments:', err);
      setError(err.response?.data?.message || 'Failed to load payments');
      setPayments([]);
      setFilteredPayments([]);
      setCompletedRevenueByCurrency([]);
      setPaypalSandboxRefundsEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (!window.confirm(`Refund the full provider charge of ${provider}?\n\nBook payment: ${book}\nProvider refund: ${provider}\n\nThis does not reverse Hire or Premium entitlement.`)) return;
    const reason = window.prompt('Required Admin refund reason:')?.trim();
    if (!reason) return;
    setRefunding(true);
    setError(null);
    try {
      await api.post(`/api/admin/payments/${payment.id}/refunds`, { reason });
      setShowDetailsModal(false);
      setSelectedPayment(null);
      await loadPayments();
    } catch (err) {
      setError(err.response?.data?.message || 'Refund could not be processed safely');
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
    const labels = {
      completed: 'Completed',
      pending: 'Pending',
      processing: 'Processing',
      pending_verification: 'Pending Verification',
      failed: 'Failed',
    };
    return labels[status] || status || 'Unknown';
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

  const getPayerName = (p) => p.User?.fullName || p.employerName || p.userEmail || 'Unknown';

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
    return <PageLoader text="Loading..." fullScreen />;
  }

  if (!authUser) return null;

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title="Payments"
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
      />

      <div className="p-4 md:p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-black">Payments</h1>
              <p className="text-black/70 mt-1">Manage and verify all payments and transactions</p>
            </div>
            <button
              onClick={loadPayments}
              className="bg-black/20 hover:bg-black/30 text-black px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Payments</p>
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <CreditCard size={20} className="text-blue-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CheckCircle size={20} className="text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completed}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
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
                placeholder="Search payments..."
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
                <option value="all">All Payments</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-700 dark:text-gray-300">{filteredPayments.length}</span> payments
          </p>
        </div>

        {/* Payments List - inline loading/error states */}
        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading payments...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-red-500/20">
            <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Failed to load payments</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadPayments}
              className="px-6 py-2.5 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition inline-flex items-center gap-2 font-medium"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments found"
            description="No payments match the current search or filters"
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-yellow-500/20">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
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
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 capitalize">{payment.paymentMethod || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          {getStatusLabel(payment.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{formatDate(payment.createdAt)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setSelectedPayment(payment); setShowDetailsModal(true); }}
                          className="px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded text-xs hover:bg-yellow-500/30 transition flex items-center gap-1"
                        >
                          <Eye size={12} />
                          View
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Details</h2>
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
                    <p className="text-sm text-gray-500 dark:text-gray-400">Transaction ID</p>
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
                    Payer
                  </h3>
                  <p className="font-medium text-gray-900 dark:text-white">{getPayerName(selectedPayment)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedPayment.userEmail || 'N/A'}</p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                    <UserIcon size={16} className="text-yellow-500" />
                    Worker
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
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedPayment.createdAt)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">Method: {selectedPayment.paymentMethod || 'N/A'}</p>
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
                      ? `${i18nT('subscriptionRefundAudit.grant')}: ${i18nT(`staffSubscription.plans.${selectedPayment.subscriptionReconciliation.grantPlan}`, { defaultValue: i18nT('staffSubscription.plans.legacy_unknown') })} · ${selectedPayment.subscriptionReconciliation.grantDurationDays} ${i18nT('staffSubscription.days')}`
                      : i18nT('subscriptionRefundAudit.noGrant')}
                  </p>
                </div>
              )}

              {(selectedPayment.refunds || []).length > 0 && (
                <div className="mt-6 bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Refund history</h3>
                  <div className="mt-3 space-y-3">
                    {selectedPayment.refunds.map((refund) => (
                      <div key={refund.id} className="text-sm border-t border-gray-200 dark:border-gray-600 pt-3 first:border-0 first:pt-0">
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{refund.type?.toLowerCase()} · {refund.status}</p>
                        <p className="text-gray-600 dark:text-gray-300">Book: {formatCurrency(refund.bookAmount, { currency: refund.bookCurrency })}</p>
                        <p className="text-gray-600 dark:text-gray-300">
                          Provider: {formatCurrency(refund.providerAmount || refund.requestedProviderAmount, { currency: refund.providerCurrency })}
                        </p>
                        {refund.reason && <p className="text-gray-500 dark:text-gray-400">Reason: {refund.reason}</p>}
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
                    {refunding ? 'Refunding…' : 'Sandbox full refund'}
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  Close
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
