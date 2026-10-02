// frontend/src/pages/TeacherPromotionHistory.jsx
// ============================================================
// TEACHER PROMOTION / SUBSCRIPTION HISTORY PAGE
// ============================================================
// Displays:
// 1. Current Teacher Premium subscription status (active/free, plan, start/end dates).
// 2. Promotion & Subscription History table/cards (date, plan, amount, currency, status, period, reference).
// 3. Responsive mobile card view + desktop table view.
// 4. Loading / empty / error states with retry option.
//
// DESIGN:
// Strictly follows the Teacher red header theme, DashboardLayout,
// and localized strings in all 6 supported languages.
// ============================================================
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import EmptyState from '../components/common/EmptyState';
import api from '../utils/api';
import {
  History,
  Crown,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  Loader2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function TeacherPromotionHistory() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPremium, setCurrentPremium] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchPromotionHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/teachers/promotion-history');
      if (res.data?.success) {
        setCurrentPremium(res.data.currentPremium || null);
        setHistory(Array.isArray(res.data.history) ? res.data.history : []);
      } else {
        setCurrentPremium(null);
        setHistory([]);
      }
    } catch (err) {
      console.error('Failed to load teacher promotion history:', err);
      setError(
        err.response?.data?.message ||
          t('teacherPromotion.messages.loadError') ||
          'Failed to load promotion history records.'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPromotionHistory();
  }, [fetchPromotionHistory]);

  const isPremiumActive = currentPremium?.status === 'active';

  // Format date safely
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Status badge styling
  const renderStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'completed' || s === 'active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900/50">
          <CheckCircle2 size={13} />
          <span>{t(`teacherPromotion.history.statuses.${s}`) || 'Completed'}</span>
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
          <Clock size={13} />
          <span>{t(`teacherPromotion.history.statuses.${s}`) || 'Pending Review'}</span>
        </span>
      );
    }
    if (s === 'failed' || s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50">
          <XCircle size={13} />
          <span>{t(`teacherPromotion.history.statuses.${s}`) || 'Failed'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
        <span>{status || '—'}</span>
      </span>
    );
  };

  return (
    <DashboardLayout requiredRole="TEACHER">
      <DashboardHeader
        title={t('teacherPromotion.headerTitle') || 'Promotion History'}
        subtitle={
          t('teacherPromotion.subtitle') ||
          'Review your Premium subscription tiers, plan activations, and payment transaction history.'
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Error notification banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-between gap-3 text-sm text-red-700 dark:text-red-300">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchPromotionHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors"
            >
              <RotateCcw size={13} />
              <span>{t('teacherPromotion.messages.retry') || 'Retry'}</span>
            </button>
          </div>
        )}

        {/* 1. Current Subscription Status Card */}
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isPremiumActive
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Crown size={26} />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    {t('teacherPromotion.currentStatus.title') || 'Current Subscription Status'}
                  </h3>
                  {isPremiumActive ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800/60">
                      <Sparkles size={13} />
                      <span>{t('teacherPromotion.currentStatus.activeBadge') || 'Active Premium'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                      {t('teacherPromotion.currentStatus.inactiveBadge') || 'Standard / Free Tier'}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isPremiumActive
                    ? t('teacherPromotion.subtitle') || 'Your teaching profile benefits from active Premium promotion.'
                    : 'Upgrade to Teacher Premium to promote your classes, subjects, and unlock exclusive tools.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 self-start md:self-center">
              <Link
                to="/subscription"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs transition-colors shadow-sm"
              >
                <ArrowUpRight size={15} />
                <span>
                  {isPremiumActive
                    ? t('teacherPromotion.currentStatus.upgradeBtn') || 'Upgrade / Extend Subscription'
                    : t('teacherPromotion.currentStatus.viewPricingBtn') || 'View Premium Plans'}
                </span>
              </Link>
            </div>
          </div>

          {/* Active Subscription Details Breakdown */}
          {isPremiumActive && currentPremium && (
            <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  {t('teacherPromotion.currentStatus.plan') || 'Active Plan'}
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white mt-1 block">
                  {t(`teacherPromotion.history.plans.${currentPremium.plan}`) || currentPremium.plan || 'Teacher Premium'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  {t('teacherPromotion.currentStatus.startDate') || 'Started On'}
                </span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1 block">
                  {formatDate(currentPremium.startDate)}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                  {t('teacherPromotion.currentStatus.endDate') || 'Valid Until'}
                </span>
                <span className="text-sm font-semibold text-green-700 dark:text-green-400 mt-1 block">
                  {formatDate(currentPremium.endDate)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Promotion & Subscription History Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <History className="text-red-600" size={18} />
                <span>{t('teacherPromotion.history.title') || 'Promotion & Subscription Records'}</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('teacherPromotion.history.subtitle') || 'All completed Premium subscription purchases and verified activations'}
              </p>
            </div>

            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 self-start sm:self-center">
              {history.length} {history.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <p className="text-xs">Loading records...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-10 text-center">
              <EmptyState
                icon={History}
                title={t('teacherPromotion.history.empty') || 'No promotion or subscription records found.'}
                description={
                  t('teacherPromotion.history.emptyDesc') ||
                  'Upgrade to Teacher Premium to promote your teaching profile and unlock advanced features.'
                }
              />
              <Link
                to="/subscription"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                <Crown size={15} />
                <span>{t('teacherPromotion.currentStatus.viewPricingBtn') || 'View Premium Plans'}</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">{t('teacherPromotion.history.tableDate') || 'Date'}</th>
                      <th className="px-5 py-3.5">{t('teacherPromotion.history.tablePlan') || 'Plan'}</th>
                      <th className="px-5 py-3.5">{t('teacherPromotion.history.tableAmount') || 'Amount'}</th>
                      <th className="px-5 py-3.5">{t('teacherPromotion.history.tableStatus') || 'Payment Status'}</th>
                      <th className="px-5 py-3.5">{t('teacherPromotion.history.tablePeriod') || 'Coverage Period'}</th>
                      <th className="px-5 py-3.5 text-right rtl:text-left">{t('teacherPromotion.history.tableReference') || 'Reference ID'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60 text-gray-700 dark:text-gray-300">
                    {history.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap text-gray-500 font-medium">
                          {formatDate(record.date || record.createdAt)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-bold text-gray-900 dark:text-white block">
                            {t(`teacherPromotion.history.plans.${record.plan}`) || record.plan || 'Teacher Premium'}
                          </span>
                          {record.paymentMethod && (
                            <span className="text-[10px] text-gray-400 block uppercase font-mono mt-0.5">
                              {record.paymentMethod}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white">
                          {record.amount > 0 ? (
                            `${record.amount} ${record.currency}`
                          ) : (
                            <span className="text-gray-400 font-sans font-normal">Free / Grant</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {renderStatusBadge(record.status)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                          {record.startDate && record.endDate ? (
                            <span>
                              {formatDate(record.startDate)} → {formatDate(record.endDate)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-5 py-4 text-right rtl:text-left whitespace-nowrap font-mono text-[11px] text-gray-400">
                          {record.reference || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View: Responsive Cards */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                {history.map((record) => (
                  <div key={record.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500">
                        {formatDate(record.date || record.createdAt)}
                      </span>
                      {renderStatusBadge(record.status)}
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {t(`teacherPromotion.history.plans.${record.plan}`) || record.plan || 'Teacher Premium'}
                      </span>
                      <span className="font-mono font-bold text-sm text-gray-900 dark:text-white">
                        {record.amount > 0 ? `${record.amount} ${record.currency}` : 'Free'}
                      </span>
                    </div>

                    {record.startDate && record.endDate && (
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 pt-1">
                        <Calendar size={13} />
                        <span>
                          {formatDate(record.startDate)} – {formatDate(record.endDate)}
                        </span>
                      </div>
                    )}

                    {record.reference && (
                      <div className="text-[10px] text-gray-400 font-mono pt-1 truncate">
                        Ref: {record.reference}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
