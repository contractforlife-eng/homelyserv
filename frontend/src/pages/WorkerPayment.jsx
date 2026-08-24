import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import { useDashboard } from '../components/layout/DashboardContext';
import hireService from '../services/hireService';
import workerEarningService from '../services/workerEarningService';
import api from '../utils/api';
import { formatCurrencyAmount, formatCurrencyTotals, getAccountCurrency, getStoredCurrency, groupCurrencyTotals } from '../utils/currencyPresentation';
import { AlertTriangle, Briefcase, CheckCircle, Clock, CreditCard, Crown, DollarSign, Info, RefreshCw, Search, User, Wallet, X } from 'lucide-react';

const localeFor = (language) => (language === 'ar' ? 'ar-EG' : 'en-US');

const formatDate = (value, language) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(localeFor(language), { year: 'numeric', month: 'short', day: 'numeric' });
};

const planLabel = (plan) => {
  if (!plan || plan === 'manual') return 'Manual Premium';
  return `${String(plan).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())} Premium`;
};

const remainingTimeLabel = (endDate, language) => {
  if (!endDate) return '—';
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return '—';
  const remainingMs = end.getTime() - Date.now();
  if (remainingMs <= 0) return 'Expired';
  const hours = Math.floor(remainingMs / (60 * 60 * 1000));
  if (hours < 24) return `${hours || 1} ${language === 'ar' ? 'ساعة متبقية' : 'hours remaining'}`;
  const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  return `${days} ${language === 'ar' ? 'يوم متبقٍ' : 'days remaining'}`;
};

const statusClass = (status) => ({
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  AWAITING_CONFIRMATION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  EARNED: 'bg-green-100 text-green-800 border-green-200',
  PAID: 'bg-blue-100 text-blue-800 border-blue-200',
  ON_HOLD: 'bg-amber-100 text-amber-800 border-amber-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
}[status] || 'bg-gray-100 text-gray-700 border-gray-200');

const statusIcon = (status) => {
  if (status === 'EARNED' || status === 'PAID') return <CheckCircle size={14} />;
  if (status === 'DISPUTED') return <AlertTriangle size={14} />;
  if (status === 'CANCELLED') return <X size={14} />;
  return <Clock size={14} />;
};

const WorkerPayment = () => {
  const { t } = useTranslation();
  const dashboard = useDashboard();
  const authUser = useAuthStore((state) => state.user);
  const [ledgerRecords, setLedgerRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState(null);
  const [earningsSummary, setEarningsSummary] = useState({ pendingContractValue: 0, earnedBalance: 0, paidTotal: 0, onHoldAmount: 0 });
  const [activeHires, setActiveHires] = useState(0);
  const [premiumHistory, setPremiumHistory] = useState({ currentPremium: null, paid: [], manual: [] });
  const [premiumHistoryLoading, setPremiumHistoryLoading] = useState(true);

  const userIsPremium = dashboard.premiumStatus?.known === true && dashboard.premiumStatus.isPremium === true;
  const language = dashboard.language;
  const locale = localeFor(language);

  const loadEarningsData = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const response = await api.get('/api/worker/earnings');
      const data = response.data || {};
      const records = Array.isArray(data.records) ? data.records : [];
      setEarningsSummary(data.summary || { pendingContractValue: 0, earnedBalance: 0, paidTotal: 0, onHoldAmount: 0 });
      setLedgerRecords(records);
      setFilteredRecords(records);
      try {
        const hires = await hireService.getMyHires();
        setActiveHires((Array.isArray(hires) ? hires : []).filter((hire) => hire.status === 'active' || hire.status === 'completed').length);
      } catch (error) {
        console.warn('Could not load active hire count:', error.message);
        setActiveHires(0);
      }
    } catch (error) {
      console.error('Error loading earnings ledger:', error);
      setEarningsSummary({ pendingContractValue: 0, earnedBalance: 0, paidTotal: 0, onHoldAmount: 0 });
      setLedgerRecords([]);
      setFilteredRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumHistory = async () => {
    if (!authUser) return;
    setPremiumHistoryLoading(true);
    try {
      const response = await api.get('/api/worker/payment-history');
      const data = response.data || {};
      setPremiumHistory({
        currentPremium: data.currentPremium || null,
        paid: Array.isArray(data.history?.paid) ? data.history.paid : [],
        manual: Array.isArray(data.history?.manual) ? data.history.manual : [],
      });
    } catch (error) {
      console.error('Error loading Premium payment history:', error);
      setPremiumHistory({ currentPremium: null, paid: [], manual: [] });
    } finally {
      setPremiumHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      loadEarningsData();
      loadPremiumHistory();
    }
  }, [authUser?.id]);

  useEffect(() => {
    const query = searchTerm.trim().toLowerCase();
    setFilteredRecords(ledgerRecords.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesSearch = !query || [record.jobTitle, record.hireId, record.idempotencyKey].some((value) => String(value || '').toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    }));
  }, [ledgerRecords, searchTerm, statusFilter]);

  const resolveEarningCurrency = (earning) => getStoredCurrency(earning, getAccountCurrency(authUser));
  const formatEarningAmount = (amount, earning) => {
    const numericAmount = Number(amount);
    return Number.isFinite(numericAmount) ? formatCurrencyAmount(numericAmount, resolveEarningCurrency(earning), locale) : '—';
  };
  const formatEarningSummary = (amount, statuses) => {
    const records = ledgerRecords.filter((record) => statuses.includes(record.status));
    if (records.length === 0) return formatEarningAmount(amount, { currency: getAccountCurrency(authUser) });
    return formatCurrencyTotals(groupCurrencyTotals(records, (record) => record.amount, resolveEarningCurrency), locale);
  };

  const premiumHistoryItems = useMemo(() => [...premiumHistory.paid, ...premiumHistory.manual].sort((a, b) => new Date(b.createdAt || b.paymentDate || 0) - new Date(a.createdAt || a.paymentDate || 0)), [premiumHistory]);
  const currentPremium = premiumHistory.currentPremium;
  const currentPremiumActive = currentPremium?.status === 'active';

  const handleRefresh = () => {
    loadEarningsData();
    loadPremiumHistory();
  };

  const handleSubmitPeriod = async (record) => {
    if (!record || submittingId) return;
    if (!window.confirm(`${t('workerPayment.submit.confirmTitle')}\n\n${t('workerPayment.submit.confirmBody')}`)) return;
    setSubmittingId(record.id);
    try {
      const data = await workerEarningService.submitWorkerEarning(record.id);
      alert(data?.success ? t('workerPayment.submit.success') : (data?.message || t('workerPayment.submit.error')));
      await loadEarningsData();
    } catch (error) {
      const message = error?.response?.data?.message === 'This period is already awaiting employer confirmation' ? t('workerPayment.submit.alreadySubmitted') : t('workerPayment.submit.error');
      alert(message);
      await loadEarningsData();
    } finally {
      setSubmittingId(null);
    }
  };

  const stats = [
    { label: t('workerPayment.stats.pendingContract'), value: formatEarningSummary(earningsSummary.pendingContractValue, ['PENDING', 'AWAITING_CONFIRMATION']), icon: DollarSign, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100/70 dark:bg-amber-900/30', card: 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60' },
    { label: t('workerPayment.stats.confirmedEarnings'), value: formatEarningSummary(earningsSummary.earnedBalance, ['EARNED']), icon: CheckCircle, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100/70 dark:bg-emerald-900/30', card: 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60' },
    { label: t('workerPayment.stats.paidThroughHomelyServ'), value: formatEarningSummary(earningsSummary.paidTotal, ['PAID']), icon: Wallet, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100/70 dark:bg-blue-900/30', card: 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/60' },
    { label: t('workerPayment.stats.activeHires'), value: activeHires, icon: Briefcase, color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100/70 dark:bg-violet-900/30', card: 'bg-violet-50/70 dark:bg-violet-950/20 border-violet-200/80 dark:border-violet-800/60' },
  ];

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader title={t('workerPayment.title')} notificationUserId={authUser?.id || authUser?.email} isPremium={userIsPremium} />
      <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 overflow-hidden flex-shrink-0 relative">{authUser?.profileImage ? <img src={authUser.profileImage} alt={authUser.fullName || t('workerPayment.worker')} className="w-full h-full object-cover" /> : <User size={28} className="text-white m-3" />}{userIsPremium && <Crown size={12} className="absolute bottom-1 right-1 text-white bg-yellow-400 rounded-full p-0.5" />}</div><div><div className="flex items-center gap-2"><h1 className="text-2xl md:text-3xl font-bold">{t('workerPayment.title')}</h1>{userIsPremium && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-400/30 border border-yellow-300/50 rounded-full text-xs font-medium"><Crown size={12} />{t('workerPayment.premiumBadge')}</span>}</div><p className="text-white/80 mt-1 text-sm md:text-base">{t('workerPayment.subtitle')}</p></div></div>
            {!userIsPremium && <Link to="/subscription" className="bg-yellow-500/30 hover:bg-yellow-500/40 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-yellow-400/30"><Crown size={16} />{t('workerPayment.getPremium')}</Link>}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3"><Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" /><div><p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{t('workerPayment.notice.title')}</p><p className="text-sm text-blue-700/90 dark:text-blue-200/80 mt-0.5">{t('workerPayment.notice.body')}</p></div></div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map(({ label, value, icon: Icon, color, bg, card }) => <div key={label} className={`${card} rounded-xl shadow-sm p-5 border`}><div className="flex items-center justify-between mb-3"><p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p><div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}><Icon size={20} className={color} /></div></div><p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white break-words">{value}</p></div>)}</div>

        <section className="bg-purple-50/60 dark:bg-purple-950/20 rounded-xl shadow-sm border border-purple-200/80 dark:border-purple-800/60 overflow-hidden" aria-labelledby="premium-history-heading">
          <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between"><div><h2 id="premium-history-heading" className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2"><Crown size={21} className="text-purple-600" />Premium Subscription</h2><p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your current entitlement and Premium payment history</p></div>{currentPremiumActive && <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">Active</span>}</div>
          <div className="p-5 md:p-6">{premiumHistoryLoading ? <div className="text-sm text-gray-500">Loading Premium history…</div> : <><div className="mb-6">{currentPremiumActive ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"><div><p className="text-xs uppercase text-gray-500">Source</p><p className="font-semibold text-gray-800 dark:text-white">{currentPremium.source === 'manual' ? 'Admin Grant' : 'Paid'}</p></div><div><p className="text-xs uppercase text-gray-500">Plan</p><p className="font-semibold text-gray-800 dark:text-white">{planLabel(currentPremium.plan)}</p></div><div><p className="text-xs uppercase text-gray-500">Start date</p><p className="font-semibold text-gray-800 dark:text-white">{formatDate(currentPremium.startDate, language)}</p></div><div><p className="text-xs uppercase text-gray-500">Expiry / remaining</p><p className="font-semibold text-gray-800 dark:text-white">{formatDate(currentPremium.endDate, language)} · {remainingTimeLabel(currentPremium.endDate, language)}</p></div></div> : <p className="text-sm text-gray-600 dark:text-gray-300">No active Premium entitlement. Historical purchases and grants remain listed below.</p>}</div><h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3">Premium payment history</h3>{premiumHistoryItems.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No Premium purchases or grants recorded.</p> : <div className="space-y-3">{premiumHistoryItems.map((item, index) => { const amount = item.source === 'paid' && item.status === 'completed' ? formatCurrencyAmount(item.amount, item.currency, locale) : item.source === 'manual' ? 'Admin Grant — no payment' : 'Payment not completed'; const historyStatus = item.source === 'paid' && item.endDate && new Date(item.endDate) < new Date() ? 'expired' : (item.subscriptionStatus || item.status); return <div key={`${item.source}-${item.createdAt || index}`} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 rounded-lg border border-gray-100 dark:border-gray-700 p-4"><div><p className="text-xs text-gray-500">Plan</p><p className="font-medium text-gray-800 dark:text-white">{planLabel(item.plan)}</p></div><div><p className="text-xs text-gray-500">Amount</p><p className="font-medium text-gray-800 dark:text-white">{amount}</p></div><div><p className="text-xs text-gray-500">Provider</p><p className="font-medium text-gray-800 dark:text-white">{item.source === 'manual' ? 'Admin Grant' : item.provider || '—'}</p></div><div><p className="text-xs text-gray-500">Payment date</p><p className="font-medium text-gray-800 dark:text-white">{formatDate(item.paymentDate, language)}</p></div><div><p className="text-xs text-gray-500">Period</p><p className="font-medium text-gray-800 dark:text-white">{formatDate(item.startDate, language)} – {formatDate(item.endDate, language)}</p></div><div><p className="text-xs text-gray-500">Status</p><span className={`inline-flex px-2 py-1 rounded-full border text-xs font-medium ${historyStatus === 'active' ? 'bg-green-100 text-green-800 border-green-200' : statusClass(historyStatus)}`}>{historyStatus || '—'}</span></div></div>; })}</div>}</>}</div>
        </section>

        <section className="bg-slate-50 dark:bg-slate-950/30 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden" aria-labelledby="earnings-history-heading">
          <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between"><h2 id="earnings-history-heading" className="text-xl font-semibold text-gray-800 dark:text-white">{t('workerPayment.paymentHistory.title')}</h2><button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500" aria-label="Refresh"><RefreshCw size={18} /></button></div>
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4"><div className="flex-1 relative"><Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder={t('workerPayment.paymentHistory.searchPlaceholder')} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" /></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full md:w-56 px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"><option value="all">{t('workerPayment.filters.all')}</option>{['PENDING', 'AWAITING_CONFIRMATION', 'EARNED', 'PAID', 'ON_HOLD', 'DISPUTED', 'CANCELLED'].map((status) => <option key={status} value={status}>{t(`workerPayment.filters.${status}`)}</option>)}</select></div>
          {loading ? <div className="p-12 text-center text-gray-500">Loading earnings…</div> : filteredRecords.length === 0 ? <div className="p-12 text-center"><CreditCard size={32} className="text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('workerPayment.noPayments')}</h3><p className="text-gray-500 dark:text-gray-400 text-sm">{t('workerPayment.noPaymentsDesc')}</p></div> : <div className="divide-y divide-gray-100 dark:divide-gray-700">{filteredRecords.map((record) => <div key={record.id} className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"><div><p className="text-xs text-gray-500">Amount</p><p className="font-semibold text-gray-900 dark:text-white">{formatEarningAmount(record.amount, record)}</p></div><div><p className="text-xs text-gray-500">Work period</p><p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(record.periodStart, language)} – {formatDate(record.periodEnd, language)}</p></div><div><p className="text-xs text-gray-500">Recorded</p><p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(record.earnedAt || record.confirmedAt || record.createdAt, language)}</p></div><div className="flex flex-col items-start gap-2"><span className={`px-3 py-1.5 rounded-full border text-xs font-medium inline-flex items-center gap-1.5 ${statusClass(record.status)}`}>{statusIcon(record.status)}{t(`workerPayment.status.${record.status}`, { defaultValue: record.status })}</span>{record.status === 'PENDING' && <button onClick={() => handleSubmitPeriod(record)} disabled={submittingId !== null} className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">{submittingId === record.id ? t('workerPayment.submit.submitting') : t('workerPayment.submit.button')}</button>}</div></div>)}</div>}
          <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">{t('workerPayment.showingResults', { count: filteredRecords.length })}</div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default WorkerPayment;
