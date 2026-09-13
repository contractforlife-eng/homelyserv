// frontend/src/components/subscription/PremiumSubscriptionSection.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import { formatCurrencyAmount } from '../../utils/currencyPresentation';

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

const premiumHistoryItemClass = (status) => {
  const normalizedStatus = String(status || '').trim().toLowerCase();
  if (['completed', 'paid', 'successful', 'succeeded', 'active'].includes(normalizedStatus)) {
    return 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/70';
  }
  if (['pending', 'processing', 'pending_verification', 'awaiting_transfer', 'proof_submitted'].includes(normalizedStatus)) {
    return 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/70';
  }
  if (['failed', 'rejected', 'cancelled', 'canceled', 'expired', 'revoked'].includes(normalizedStatus)) {
    return 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-800/70';
  }
  return 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-700';
};

const PremiumSubscriptionSection = ({ className = '' }) => {
  const { t, i18n } = useTranslation();
  const authUser = useAuthStore((state) => state.user);
  const [premiumHistory, setPremiumHistory] = useState({ currentPremium: null, paid: [], manual: [] });
  const [loading, setLoading] = useState(true);

  const language = i18n.language || 'en';
  const locale = localeFor(language);

  const planLabel = (plan) => {
    if (!plan || plan === 'manual') {
      return t('premiumSubscription.manualPremium', 'Manual Premium');
    }
    const formattedPlanName = String(plan).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
    return t('premiumSubscription.planPremium', { plan: formattedPlanName, defaultValue: `${formattedPlanName} Premium` });
  };

  const remainingTimeLabel = (endDate) => {
    if (!endDate) return '—';
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) return '—';
    const remainingMs = end.getTime() - Date.now();
    if (remainingMs <= 0) {
      return t('premiumSubscription.expired', 'Expired');
    }
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    if (hours < 24) {
      const count = hours || 1;
      return t('premiumSubscription.hoursRemaining', { count, defaultValue: `${count} hours remaining` });
    }
    const days = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
    return t('premiumSubscription.daysRemaining', { count: days, defaultValue: `${days} days remaining` });
  };

  const loadPremiumHistory = async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      let response;
      try {
        response = await api.get('/api/payments/subscription-history');
      } catch (err) {
        // Fallback for worker endpoint if needed
        response = await api.get('/api/worker/payment-history');
      }
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authUser?.id) {
      loadPremiumHistory();
    }
  }, [authUser?.id]);

  const premiumHistoryItems = useMemo(
    () => [...premiumHistory.paid, ...premiumHistory.manual].sort(
      (a, b) => new Date(b.createdAt || b.paymentDate || 0) - new Date(a.createdAt || a.paymentDate || 0)
    ),
    [premiumHistory]
  );

  const currentPremium = premiumHistory.currentPremium;
  const currentPremiumActive = currentPremium?.status === 'active';

  return (
    <section
      className={`bg-purple-50/60 dark:bg-purple-950/20 rounded-xl shadow-sm border border-purple-200/80 dark:border-purple-800/60 overflow-hidden ${className}`}
      aria-labelledby="premium-history-heading"
    >
      <div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <h2 id="premium-history-heading" className="text-xl font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <Crown size={21} className="text-purple-600" />
            {t('premiumSubscription.title', 'Premium Subscription')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('premiumSubscription.subtitle', 'Your current entitlement and Premium payment history')}
          </p>
        </div>
        {currentPremiumActive && (
          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
            {t('premiumSubscription.active', 'Active')}
          </span>
        )}
      </div>

      <div className="p-5 md:p-6">
        {loading ? (
          <div className="text-sm text-gray-500">{t('premiumSubscription.loading', 'Loading Premium history…')}</div>
        ) : (
          <>
            <div className="mb-6">
              {currentPremiumActive ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs uppercase text-gray-500">{t('premiumSubscription.source', 'Source')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {currentPremium.source === 'manual'
                        ? t('premiumSubscription.adminGrant', 'Admin Grant')
                        : t('premiumSubscription.paid', 'Paid')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">{t('premiumSubscription.plan', 'Plan')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{planLabel(currentPremium.plan)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">{t('premiumSubscription.startDate', 'Start date')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">{formatDate(currentPremium.startDate, language)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">{t('premiumSubscription.expiryRemaining', 'Expiry / remaining')}</p>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {formatDate(currentPremium.endDate, language)} · {remainingTimeLabel(currentPremium.endDate)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('premiumSubscription.noActiveEntitlement', 'No active Premium entitlement. Historical purchases and grants remain listed below.')}
                </p>
              )}
            </div>

            <h3 className="text-base font-semibold text-gray-800 dark:text-white mb-3">
              {t('premiumSubscription.historyTitle', 'Premium payment history')}
            </h3>

            {premiumHistoryItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('premiumSubscription.noHistory', 'No Premium purchases or grants recorded.')}
              </p>
            ) : (
              <div className="space-y-3">
                {premiumHistoryItems.map((item, index) => {
                  const amount = item.source === 'paid' && item.status === 'completed'
                    ? formatCurrencyAmount(item.amount, item.currency, locale)
                    : item.source === 'manual'
                      ? t('premiumSubscription.adminGrantNoPayment', 'Admin Grant — no payment')
                      : t('premiumSubscription.paymentNotCompleted', 'Payment not completed');
                  const historyStatus = item.source === 'paid' && item.endDate && new Date(item.endDate) < new Date()
                    ? 'expired'
                    : (item.subscriptionStatus || item.status);
                  return (
                    <div
                      key={`${item.source}-${item.createdAt || index}`}
                      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 rounded-lg border p-4 ${premiumHistoryItemClass(historyStatus)}`}
                    >
                      <div>
                        <p className="text-xs text-gray-500">{t('premiumSubscription.plan', 'Plan')}</p>
                        <p className="font-medium text-gray-800 dark:text-white">{planLabel(item.plan)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('premiumSubscription.amount', 'Amount')}</p>
                        <p className="font-medium text-gray-800 dark:text-white">{amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('premiumSubscription.provider', 'Provider')}</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {item.source === 'manual' ? t('premiumSubscription.adminGrant', 'Admin Grant') : item.provider || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('premiumSubscription.paymentDate', 'Payment date')}</p>
                        <p className="font-medium text-gray-800 dark:text-white">{formatDate(item.paymentDate, language)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('premiumSubscription.period', 'Period')}</p>
                        <p className="font-medium text-gray-800 dark:text-white">
                          {formatDate(item.startDate, language)} – {formatDate(item.endDate, language)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('premiumSubscription.status', 'Status')}</p>
                        <span
                          className={`inline-flex px-2 py-1 rounded-full border text-xs font-medium ${
                            historyStatus === 'active' ? 'bg-green-100 text-green-800 border-green-200' : statusClass(historyStatus)
                          }`}
                        >
                          {historyStatus === 'expired'
                            ? t('premiumSubscription.expired', 'Expired')
                            : (historyStatus || '—')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default PremiumSubscriptionSection;
