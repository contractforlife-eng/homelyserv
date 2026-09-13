import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import PremiumSubscriptionSection from '../components/subscription/PremiumSubscriptionSection';
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

  useEffect(() => {
    if (authUser?.id) {
      loadEarningsData();
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

  const handleRefresh = () => {
    loadEarningsData();
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

        {/* Premium Subscription */}
        <PremiumSubscriptionSection />

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
