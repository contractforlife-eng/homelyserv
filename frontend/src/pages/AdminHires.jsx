// src/pages/AdminHires.jsx - Admin hiring management dashboard (CRM)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import hireService from '../services/hireService';
import { UserAvatar, UserDisplayName } from '../components/users';
import { formatCompensationAmount, resolveCompensationCurrency } from '../utils/compensationDisplay';
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  User,
  Mail,
  Phone,
  MapPin,
  Star,
  AlertTriangle,
  Building2,
  RefreshCw,
  Crown,
  Wallet,
  ArrowRight,
  MessageSquare,
  MessagesSquare,
  UserRound,
  ShieldX,
  X,
  Banknote,
  TrendingUp,
  Hourglass,
  CalendarClock,
  ArrowRightCircle
} from 'lucide-react';

// ============================================================
// SINGLE SOURCE OF TRUTH — canonical hire statuses (Hire model)
//   offer_sent  -> worker accepted, awaiting commission payment
//   active      -> commission paid, employment running
//   terminated  -> employer ended the hire
// ============================================================
const HIRE_STATUS = {
  OFFER_SENT: 'offer_sent',
  ACTIVE: 'active',
  TERMINATED: 'terminated'
};

// Collapse legacy / alias values into canonical ones
const normalizeStatus = (status) => {
  switch (status) {
    case 'hired':
    case 'accepted':
    case 'completed':
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

// Canonical payment buckets derived from raw paymentStatus
const normalizePayment = (paymentStatus) => {
  const ps = (paymentStatus || '').toLowerCase();
  if (ps === 'completed' || ps === 'confirmed' || ps === 'paid') return 'paid';
  if (ps === 'pending' || ps === 'processing') return 'processing';
  if (ps === 'refunded') return 'refunded';
  return 'unpaid';
};

const AdminHires = () => {
  const { t: i18nT, i18n } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);

  const [loading, setLoading] = useState(true);
  const [hires, setHires] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // hire status
  const [paymentFilter, setPaymentFilter] = useState('all'); // payment bucket
  const [sortBy, setSortBy] = useState('newest');
  const [selectedHire, setSelectedHire] = useState(null);

  const t = i18nT('adminHiresPage', { returnObjects: true });

  // ============================================================
  // LOAD HIRES
  // ============================================================
  const loadHires = useCallback(async () => {
    setLoading(true);
    try {
      const data = await hireService.getAllHires();
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setHires(list);
    } catch (error) {
      console.error('Error loading hires:', error);
      setHires([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
    loadHires();
  }, [authUser, isAuthenticated, authLoading, navigate, loadHires]);

  // ============================================================
  // SINGLE FILTER + SEARCH + SORT PIPELINE
  // ============================================================
  const filteredHires = useMemo(() => {
    let list = [...hires];

    if (statusFilter !== 'all') {
      list = list.filter(h => normalizeStatus(h.status) === statusFilter);
    }

    if (paymentFilter !== 'all') {
      list = list.filter(h => normalizePayment(h.paymentStatus) === paymentFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(h =>
        h.id?.toLowerCase().includes(q) ||
        h.hireId?.toLowerCase().includes(q) ||
        h.employerName?.toLowerCase().includes(q) ||
        h.employerEmail?.toLowerCase().includes(q) ||
        h.employerPhone?.toLowerCase().includes(q) ||
        h.workerName?.toLowerCase().includes(q) ||
        h.workerEmail?.toLowerCase().includes(q) ||
        h.workerPhone?.toLowerCase().includes(q) ||
        h.jobTitle?.toLowerCase().includes(q)
      );
    }

    const commission = (h) => Number(h.commissionAmount ?? h.totalDue ?? 0);
    const compareCommissionWithinCurrency = (a, b, direction) => {
      const currencyComparison = resolveCompensationCurrency(a).localeCompare(resolveCompensationCurrency(b));
      return currencyComparison || direction * (commission(a) - commission(b));
    };
    const date = (h) => new Date(h.createdAt || 0).getTime();

    switch (sortBy) {
      case 'oldest':
        list.sort((a, b) => date(a) - date(b));
        break;
      case 'highestCommission':
        list.sort((a, b) => compareCommissionWithinCurrency(a, b, -1));
        break;
      case 'lowestCommission':
        list.sort((a, b) => compareCommissionWithinCurrency(a, b, 1));
        break;
      case 'newest':
      default:
        list.sort((a, b) => date(b) - date(a));
        break;
    }

    return list;
  }, [hires, statusFilter, paymentFilter, searchTerm, sortBy]);

  // ============================================================
  // STATISTICS (all from real hire data)
  // ============================================================
  const stats = useMemo(() => {
    const isPaid = (h) => normalizePayment(h.paymentStatus) === 'paid';
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const aggregateCommission = (records) => {
      const totals = new Map();
      records.forEach((hire) => {
        const currency = resolveCompensationCurrency(hire);
        const source = String(hire.commissionAmount ?? hire.totalDue ?? 0);
        const match = source.match(/^(\d+)(?:\.(\d+))?$/);
        if (!match) return;
        const fraction = `${match[2] || ''}000`;
        let minor = BigInt(match[1]) * 100n + BigInt(fraction.slice(0, 2));
        if (Number(fraction[2]) >= 5) minor += 1n;
        totals.set(currency, (totals.get(currency) || 0n) + minor);
      });
      return [...totals.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([currency, minor]) => ({
        currency,
        amount: `${minor / 100n}.${(minor % 100n).toString().padStart(2, '0')}`,
      }));
    };
    const paidHires = hires.filter(isPaid);
    const outstandingHires = hires.filter(h => !isPaid(h));

    return {
      total: hires.length,
      active: hires.filter(h => normalizeStatus(h.status) === HIRE_STATUS.ACTIVE).length,
      awaiting: hires.filter(h => normalizeStatus(h.status) === HIRE_STATUS.OFFER_SENT).length,
      terminated: hires.filter(h => normalizeStatus(h.status) === HIRE_STATUS.TERMINATED).length,
      totalCommission: aggregateCommission(hires),
      collected: aggregateCommission(paidHires),
      outstanding: aggregateCommission(outstandingHires),
      today: hires.filter(h => new Date(h.createdAt || 0) >= todayStart).length
    };
  }, [hires]);

  // ============================================================
  // HELPERS
  // ============================================================
  const getStatusBadge = (status) => {
    const c = normalizeStatus(status);
    const map = {
      [HIRE_STATUS.ACTIVE]: { cls: 'bg-green-500/15 text-green-400 border border-green-500/30', icon: <CheckCircle size={12} />, label: t.status.active },
      [HIRE_STATUS.OFFER_SENT]: { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', icon: <Clock size={12} />, label: t.status.offer_sent },
      [HIRE_STATUS.TERMINATED]: { cls: 'bg-red-500/15 text-red-400 border border-red-500/30', icon: <XCircle size={12} />, label: t.status.terminated }
    };
    return map[c] || { cls: 'bg-gray-500/15 text-gray-400 border border-gray-500/30', icon: <AlertTriangle size={12} />, label: t.status.unknown };
  };

  const getPaymentBadge = (paymentStatus) => {
    const p = normalizePayment(paymentStatus);
    const map = {
      paid: { cls: 'bg-green-500/15 text-green-400 border border-green-500/30', label: t.payment.paid },
      unpaid: { cls: 'bg-gray-500/15 text-gray-400 border border-gray-500/30', label: t.payment.unpaid },
      processing: { cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/30', label: t.payment.processing },
      refunded: { cls: 'bg-purple-500/15 text-purple-400 border border-purple-500/30', label: t.payment.refunded }
    };
    return map[p];
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString(i18n.resolvedLanguage || 'en', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount, hire) => formatCompensationAmount(amount, hire);
  const formatAggregate = (totals) => totals.length
    ? totals.map(({ amount, currency }) => `${Number(amount).toLocaleString()} ${currency}`).join(' · ')
    : '—';
  const getCommission = (h) => Number(h.commissionAmount ?? h.totalDue ?? 0);

  const hasActiveFilters = statusFilter !== 'all' || paymentFilter !== 'all' || searchTerm.trim() !== '';
  const clearFilters = () => {
    setStatusFilter('all');
    setPaymentFilter('all');
    setSearchTerm('');
  };

  // ============================================================
  // ACTIONS
  // ============================================================
  // Open the selected user's profile inside the ADMIN chrome.
  // The viewed profile is isolated in UserProfileView's local state —
  // the authenticated Admin session is never modified.
  const openEmployer = (hire) => {
    const id = hire.employerId;
    if (!id) return;
    navigate(`/admin/users/${id}`);
  };
  const openWorker = (hire) => {
    const id = hire.workerId || hire.workerProfileId;
    if (!id) return;
    navigate(`/admin/users/${id}`);
  };
  const messageEmployer = (hire) => {
    navigate('/admin/messages', {
      state: { targetUserId: hire.employerId, targetUserName: hire.employerName || t.table.employer, targetUserRole: 'EMPLOYER' }
    });
  };
  const messageWorker = (hire) => {
    navigate('/admin/messages', {
      state: { targetUserId: hire.workerId, targetUserName: hire.workerName || t.table.worker, targetUserRole: 'WORKER' }
    });
  };

  // Danger action: terminate the hire (uses the existing update-status API)
  const terminateHire = async (hire) => {
    const id = hire.id || hire.hireId;
    if (!id) return;
    if (!window.confirm(t.terminateConfirm)) return;
    try {
      await hireService.updateHireStatus(id, HIRE_STATUS.TERMINATED);
      setHires(prev => prev.map(h => (h.id === id || h.hireId === id) ? { ...h, status: HIRE_STATUS.TERMINATED } : h));
    } catch (error) {
      console.error('Error terminating hire:', error);
      alert(t.terminateError);
    }
  };

  const handleRefresh = () => loadHires();

  // ============================================================
  // RENDER
  // ============================================================
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!authUser) return null;

  const statCards = [
    { key: 'total', label: t.stats.total, value: stats.total, icon: Briefcase, color: 'text-blue-400 bg-blue-500/15' },
    { key: 'active', label: t.stats.active, value: stats.active, icon: CheckCircle, color: 'text-green-400 bg-green-500/15' },
    { key: 'awaiting', label: t.stats.awaiting, value: stats.awaiting, icon: Hourglass, color: 'text-amber-400 bg-amber-500/15' },
    { key: 'terminated', label: t.stats.terminated, value: stats.terminated, icon: XCircle, color: 'text-red-400 bg-red-500/15' },
    { key: 'totalCommission', label: i18nT('adminFinancial.commissionObligations'), value: formatAggregate(stats.totalCommission), icon: Banknote, color: 'text-yellow-400 bg-yellow-500/15' },
    { key: 'collected', label: i18nT('adminFinancial.paidCommissionObligations'), value: formatAggregate(stats.collected), icon: TrendingUp, color: 'text-green-400 bg-green-500/15' },
    { key: 'outstanding', label: i18nT('adminFinancial.outstandingCommissionObligations'), value: formatAggregate(stats.outstanding), icon: Wallet, color: 'text-orange-400 bg-orange-500/15' },
    { key: 'today', label: t.stats.today, value: stats.today, icon: CalendarClock, color: 'text-purple-400 bg-purple-500/15' }
  ];

  return (
    <DashboardLayout requiredRole="ADMIN" variant="admin">
      <DashboardHeader
        title={t.title}
        notificationUserId={authUser?.id || authUser?.email}
        isPremium={false}
        variant="admin"
        rightContent={
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 border border-yellow-500/30 rounded-lg text-sm font-medium text-yellow-400 hover:bg-yellow-500/10 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            {t.refresh}
          </button>
        }
      />

      <div className="p-4 md:p-6 space-y-6 bg-[#0a0a0a] min-h-screen">
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white">{t.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.subtitle}</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.key} className="bg-[#1a1a1a] rounded-xl border border-yellow-500/15 p-4 hover:border-yellow-500/35 transition">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-xl font-bold text-white mt-1.5">{card.value}</p>
              </div>
            );
          })}
        </div>

        {/* Search + Filters */}
        <div className="bg-[#1a1a1a] rounded-xl border border-yellow-500/15 p-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            >
              <option value="all">{t.filters.all}</option>
              <option value={HIRE_STATUS.OFFER_SENT}>{t.filters.offer_sent}</option>
              <option value={HIRE_STATUS.ACTIVE}>{t.filters.active}</option>
              <option value={HIRE_STATUS.TERMINATED}>{t.filters.terminated}</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            >
              <option value="all">{t.filters.allPayments}</option>
              <option value="paid">{t.filters.paid}</option>
              <option value="unpaid">{t.filters.unpaid}</option>
              <option value="processing">{t.filters.processing}</option>
              <option value="refunded">{t.filters.refunded}</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
            >
              <option value="newest">{t.filters.newest}</option>
              <option value="oldest">{t.filters.oldest}</option>
              <option value="highestCommission">{t.filters.highestCommission}</option>
              <option value="lowestCommission">{t.filters.lowestCommission}</option>
            </select>
          </div>
          {hasActiveFilters && (
            <div className="mt-2 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-xs text-gray-400 hover:text-yellow-400 transition-colors"
              >
                {t.clearFilters}
              </button>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-400">
          {t.showing} <span className="font-semibold text-white">{filteredHires.length}</span> {t.hiresWord}
        </p>

        {/* Empty state */}
        {filteredHires.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-xl border border-yellow-500/15 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">{t.noHires}</h3>
            <p className="text-gray-400">{t.noHiresDesc}</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2 border border-yellow-500/40 text-yellow-400 rounded-lg hover:bg-yellow-500/10 transition"
              >
                {t.clearFilters}
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-[#1a1a1a] rounded-xl border border-yellow-500/15 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0a0a0a] border-b border-yellow-500/15">
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.employer}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3"></th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.worker}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.salary}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.commission}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.payment}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.status}</th>
                      <th className="text-left text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.hiredOn}</th>
                      <th className="text-right text-[11px] font-semibold text-gray-400 uppercase tracking-wide px-4 py-3">{t.table.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/60">
                    {filteredHires.map((hire) => {
                      const status = getStatusBadge(hire.status);
                      const payment = getPaymentBadge(hire.paymentStatus);
                      const key = hire.id || hire.hireId || hire.offerId;
                      return (
                        <tr key={key} className="hover:bg-yellow-500/5 transition-colors">
                          {/* Employer */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar name={hire.employerName} image={hire.employerImage || null} role="EMPLOYER" size="sm" className="border border-yellow-500/30" />
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate flex items-center gap-1">
                                  <UserDisplayName name={hire.employerName || t.unknown} role="EMPLOYER" isPremium={hire.employerIsPremium} />
                                  {hire.employerIsPremium && <Crown size={11} className="text-yellow-400" />}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate">{hire.employerEmail || ''}</p>
                              </div>
                            </div>
                          </td>
                          {/* Relationship arrow */}
                          <td className="px-2 py-3">
                            <div className="flex flex-col items-center text-yellow-500/70">
                              <ArrowRight size={16} />
                              <span className="text-[9px] font-bold tracking-widest">{t.hired}</span>
                            </div>
                          </td>
                          {/* Worker */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <UserAvatar name={hire.workerName} image={hire.workerImage || null} role="WORKER" size="sm" className="border border-red-500/30" />
                              <div className="min-w-0">
                                <p className="font-semibold text-white text-sm truncate flex items-center gap-1">
                                  <UserDisplayName name={hire.workerName || t.unknown} role="WORKER" isPremium={hire.workerIsPremium} />
                                  {hire.workerIsPremium && <Crown size={11} className="text-yellow-400" />}
                                </p>
                                <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                                  {hire.jobTitle || t.serviceProvider}
                                  {hire.workerRating ? (
                                    <span className="inline-flex items-center gap-0.5 text-yellow-400">
                                      <Star size={10} className="fill-yellow-400" />{hire.workerRating}
                                    </span>
                                  ) : null}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Salary */}
                          <td className="px-4 py-3">
                            <p className="font-medium text-white text-sm">{formatCurrency(hire.agreedSalary ?? hire.salary, hire)}</p>
                            <p className="text-[11px] text-gray-500">{t.perMonth}</p>
                          </td>
                          {/* Commission */}
                          <td className="px-4 py-3">
                            <p className="font-medium text-yellow-400 text-sm">{formatCurrency(getCommission(hire), hire)}</p>
                          </td>
                          {/* Payment */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${payment.cls}`}>
                              <Wallet size={11} />
                              {payment.label}
                            </span>
                          </td>
                          {/* Status */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${status.cls}`}>
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          {/* Date */}
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-300 flex items-center gap-1.5">
                              <Calendar size={13} className="text-gray-500" />
                              {formatDate(hire.createdAt || hire.startDate)}
                            </p>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3">
                            <ActionButtons
                              hire={hire}
                              t={t}
                              onView={setSelectedHire}
                              onOpenEmployer={openEmployer}
                              onOpenWorker={openWorker}
                              onMessageEmployer={messageEmployer}
                              onMessageWorker={messageWorker}
                              onTerminate={terminateHire}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile / tablet cards */}
            <div className="lg:hidden space-y-3">
              {filteredHires.map((hire) => {
                const status = getStatusBadge(hire.status);
                const payment = getPaymentBadge(hire.paymentStatus);
                const key = hire.id || hire.hireId || hire.offerId;
                return (
                  <div key={key} className="bg-[#1a1a1a] rounded-xl border border-yellow-500/15 p-4">
                    {/* Relationship */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar name={hire.employerName} image={hire.employerImage || null} role="EMPLOYER" size="sm" className="border border-yellow-500/30" />
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500">{t.table.employer}</p>
                          <UserDisplayName name={hire.employerName || t.unknown} role="EMPLOYER" isPremium={hire.employerIsPremium} defaultNameClassName="font-semibold text-white" />
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-yellow-500/70 flex-shrink-0">
                        <ArrowRight size={16} />
                        <span className="text-[9px] font-bold tracking-widest">{t.hired}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0 justify-end">
                        <div className="min-w-0 text-right">
                          <p className="text-xs text-gray-500">{t.table.worker}</p>
                          <UserDisplayName name={hire.workerName || t.unknown} role="WORKER" isPremium={hire.workerIsPremium} defaultNameClassName="font-semibold text-white" />
                        </div>
                        <UserAvatar name={hire.workerName} image={hire.workerImage || null} role="WORKER" size="sm" className="border border-red-500/30" />
                      </div>
                    </div>

                    {/* Facts */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-800">
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">{t.table.salary}</p>
                        <p className="text-sm font-semibold text-white">{formatCurrency(hire.agreedSalary ?? hire.salary, hire)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">{t.table.commission}</p>
                        <p className="text-sm font-semibold text-yellow-400">{formatCurrency(getCommission(hire), hire)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wide text-gray-500">{t.table.hiredOn}</p>
                        <p className="text-sm font-semibold text-white">{formatDate(hire.createdAt || hire.startDate)}</p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${status.cls}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${payment.cls}`}>
                        <Wallet size={11} />
                        {payment.label}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end mt-3 pt-3 border-t border-gray-800">
                      <ActionButtons
                        hire={hire}
                        t={t}
                        onView={setSelectedHire}
                        onOpenEmployer={openEmployer}
                        onOpenWorker={openWorker}
                        onMessageEmployer={messageEmployer}
                        onMessageWorker={messageWorker}
                        onTerminate={terminateHire}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Details Modal */}
      {selectedHire && (
        <HireDetailsModal
          hire={selectedHire}
          t={t}
          onClose={() => setSelectedHire(null)}
          getStatusBadge={getStatusBadge}
          getPaymentBadge={getPaymentBadge}
          formatDate={formatDate}
          formatCurrency={formatCurrency}
          getCommission={getCommission}
        />
      )}
    </DashboardLayout>
  );
};

// ============================================================
// ACTION BUTTONS — grouped, distinct icons/colors, with tooltips
// Groups: view | profile actions | communication actions | danger
// ============================================================
const ActionButtons = ({ hire, t, onView, onOpenEmployer, onOpenWorker, onMessageEmployer, onMessageWorker, onTerminate }) => {
  const Btn = ({ onClick, title, className, children }) => (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded-lg transition-colors ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center justify-end gap-1">
      {/* View */}
      <Btn
        onClick={() => onView(hire)}
        title={t.actions.view}
        className="text-yellow-400 hover:bg-yellow-500/15"
      >
        <Eye size={16} />
      </Btn>

      <span className="w-px h-4 bg-gray-700/60 mx-0.5" aria-hidden="true" />

      {/* Profile actions */}
      <Btn
        onClick={() => onOpenEmployer(hire)}
        title={t.actions.employerProfile}
        className="text-blue-400 hover:bg-blue-500/15"
      >
        <Building2 size={16} />
      </Btn>
      <Btn
        onClick={() => onOpenWorker(hire)}
        title={t.actions.workerProfile}
        className="text-green-400 hover:bg-green-500/15"
      >
        <UserRound size={16} />
      </Btn>

      <span className="w-px h-4 bg-gray-700/60 mx-0.5" aria-hidden="true" />

      {/* Communication actions */}
      <Btn
        onClick={() => onMessageEmployer(hire)}
        title={t.actions.messageEmployer}
        className="text-teal-400 hover:bg-teal-500/15"
      >
        <MessageSquare size={16} />
      </Btn>
      <Btn
        onClick={() => onMessageWorker(hire)}
        title={t.actions.messageWorker}
        className="text-emerald-400 hover:bg-emerald-500/15"
      >
        <MessagesSquare size={16} />
      </Btn>

      <span className="w-px h-4 bg-gray-700/60 mx-0.5" aria-hidden="true" />

      {/* Danger action */}
      <Btn
        onClick={() => onTerminate(hire)}
        title={t.actions.terminate}
        className="text-red-400 hover:bg-red-500/15"
      >
        <ShieldX size={16} />
      </Btn>
    </div>
  );
};

// ============================================================
// HIRE DETAILS MODAL (CRM overview)
// ============================================================
const HireDetailsModal = ({ hire, t, onClose, getStatusBadge, getPaymentBadge, formatDate, formatCurrency, getCommission }) => {
  const status = getStatusBadge(hire.status);
  const payment = getPaymentBadge(hire.paymentStatus);
  const paid = normalizePayment(hire.paymentStatus) === 'paid';

  const timeline = [
    { label: t.modal.offerSent, date: hire.createdAt, done: true },
    { label: t.modal.paymentCompleted, date: paid ? hire.updatedAt : null, done: paid },
    { label: t.modal.hireActivated, date: normalizeStatus(hire.status) !== HIRE_STATUS.OFFER_SENT ? hire.updatedAt : null, done: normalizeStatus(hire.status) !== HIRE_STATUS.OFFER_SENT }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-[#141414] rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-yellow-500/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-yellow-500/15 sticky top-0 bg-[#141414] z-10">
          <h2 className="text-xl font-semibold text-white">{t.modal.title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Relationship */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4 bg-[#0a0a0a] rounded-xl p-4 border border-yellow-500/10">
            {/* Employer */}
            <div className="flex items-center gap-3">
              <UserAvatar name={hire.employerName} image={hire.employerImage || null} role="EMPLOYER" size="lg" className="border-2 border-yellow-500/40" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{t.table.employer}</p>
                <p className="font-semibold text-white truncate flex items-center gap-1">
                  <UserDisplayName name={hire.employerName || t.unknown} role="EMPLOYER" isPremium={hire.employerIsPremium} size="lg" />
                  {hire.employerIsPremium && <Crown size={12} className="text-yellow-400" />}
                </p>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1"><Mail size={11} />{hire.employerEmail || t.modal.notProvided}</p>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1"><Phone size={11} />{hire.employerPhone || t.modal.notProvided}</p>
              </div>
            </div>
            {/* Arrow */}
            <div className="flex md:flex-col items-center justify-center text-yellow-500 gap-1">
              <ArrowRightCircle size={22} className="rotate-90 md:rotate-0" />
              <span className="text-[10px] font-bold tracking-widest">{t.hired}</span>
            </div>
            {/* Worker */}
            <div className="flex items-center gap-3 md:justify-end">
              <div className="min-w-0 md:text-right">
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{t.table.worker}</p>
                <p className="font-semibold text-white truncate flex items-center gap-1 md:justify-end">
                  <UserDisplayName name={hire.workerName || t.unknown} role="WORKER" isPremium={hire.workerIsPremium} size="lg" />
                  {hire.workerIsPremium && <Crown size={12} className="text-yellow-400" />}
                </p>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1 md:justify-end"><Briefcase size={11} />{hire.jobTitle || t.serviceProvider}</p>
                <p className="text-xs text-gray-400 truncate flex items-center gap-1 md:justify-end">
                  <Star size={11} className="text-yellow-400" />{hire.workerRating ?? t.modal.notProvided}
                </p>
              </div>
              <UserAvatar name={hire.workerName} image={hire.workerImage || null} role="WORKER" size="lg" className="border-2 border-red-500/40" />
            </div>
          </div>

          {/* Current status + financial */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-yellow-500/10">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{t.modal.currentStatus}</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.modal.hireStatus}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${status.cls}`}>{status.icon}{status.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.modal.paymentStatus}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${payment.cls}`}><Wallet size={11} />{payment.label}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-gray-500">{t.modal.hireDate}</span>
                  <span className="text-gray-200">{formatDate(hire.createdAt || hire.startDate)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-xs text-gray-500">{t.modal.lastUpdated}</span>
                  <span className="text-gray-200">{formatDate(hire.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Financial */}
            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-yellow-500/10">
              <h4 className="text-sm font-semibold text-gray-300 mb-3">{t.modal.financial}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.modal.salary}</span>
                  <span className="font-semibold text-white">{formatCurrency(hire.agreedSalary ?? hire.salary, hire)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.modal.commission}</span>
                  <span className="font-semibold text-yellow-400">{formatCurrency(getCommission(hire), hire)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.modal.vat}</span>
                  <span className="text-gray-200">{formatCurrency(hire.vatAmount, hire)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-800 pt-2">
                  <span className="text-xs text-gray-500">{t.modal.totalDue}</span>
                  <span className="font-bold text-white">{formatCurrency(hire.totalDue ?? getCommission(hire), hire)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t.modal.paymentRef}</span>
                  <span className="text-gray-400 text-xs">{hire.paymentReference || t.modal.notProvided}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-[#0a0a0a] rounded-xl p-4 border border-yellow-500/10">
            <h4 className="text-sm font-semibold text-gray-300 mb-4">{t.modal.timeline}</h4>
            <div className="space-y-4">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/40 text-gray-500'}`}>
                    {step.done ? <CheckCircle size={14} /> : <Clock size={14} />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</p>
                    <p className="text-xs text-gray-500">{step.date ? formatDate(step.date) : '—'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {hire.additionalNotes && (
            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-yellow-500/10">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">{t.modal.notes}</h4>
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{hire.additionalNotes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminHires;
