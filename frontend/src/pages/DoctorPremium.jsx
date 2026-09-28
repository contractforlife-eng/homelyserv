// frontend/src/pages/DoctorPremium.jsx
// ============================================================
// DOCTOR PREMIUM
// A dedicated, always-visible Premium page for the DOCTOR role.
//
// This page reuses the EXISTING HomelyServ Premium architecture:
//   • GET /api/payments/subscription-quote   (server-authoritative,
//     role-aware price book — Doctor pricing comes from the backend)
//   • GET /api/payments/subscription-status  (authoritative state)
//   • PremiumSubscriptionSection             (active subscription + history)
//   • /subscription                          (existing payment flow)
//
// No new subscription system, no new payment system, and no price is
// ever hardcoded here: every amount is rendered from the server quote.
// Worker/Employer pricing is untouched.
// ============================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import PremiumSubscriptionSection from '../components/subscription/PremiumSubscriptionSection';
import { fetchSubscriptionStatus, getSubscriptionQuote } from '../services/paymentService';
import {
  formatSubscriptionAmount,
  getRenderableSubscriptionPlans,
  getPreferredSubscriptionPlan
} from '../utils/subscriptionQuotePresentation';
import {
  Crown, CheckCircle2, Loader2, AlertCircle, Sparkles, BarChart3,
  Eye, CalendarCheck, FileText, ShieldCheck
} from 'lucide-react';

// Plan labels are REUSED from the existing HomelyServ Doctor Premium
// namespace (doctorCenter.*) so this page never exposes raw keys and stays
// consistent with the rest of the Premium design language.
const PLAN_LABEL_KEYS = {
  weekly: 'doctorCenter.planWeekly',
  monthly: 'doctorCenter.planMonthly',
  annual: 'doctorCenter.planAnnual'
};

const localeFor = (language) => (language === 'ar' ? 'ar-EG' : 'en-US');

const formatDate = (value, language) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(localeFor(language), { year: 'numeric', month: 'short', day: 'numeric' });
};

const PlanCard = ({ plan, active, label, onSelect }) => {
  const { t } = useTranslation();
  const purchasable = plan.purchaseEnabled === true;

  return (
    <button
      type="button"
      disabled={!purchasable}
      onClick={() => onSelect?.(plan.id)}
      className={`text-left rounded-xl border p-4 transition-all ${
        active
          ? 'border-red-500 ring-2 ring-red-200 dark:ring-red-900 bg-red-50/50 dark:bg-red-950/20'
          : 'border-gray-200 dark:border-gray-700'
      } ${purchasable ? '' : 'opacity-60'}`}
    >
      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="block mt-2 text-xl font-bold text-gray-900 dark:text-white break-words">
        {formatSubscriptionAmount(plan.amount, plan.currency) || '—'}
      </span>
      {typeof plan.durationDays === 'number' && (
        <span className="block mt-1 text-[11px] text-gray-500 dark:text-gray-400">
          {t('doctorCenter.durationDays', { days: plan.durationDays })}
        </span>
      )}
      {!purchasable && (
        <span className="block mt-2 text-[11px] font-medium text-gray-400">
          {t('subscriptionPlanOptions.purchaseComingSoon')}
        </span>
      )}
      {active && purchasable && (
        <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400">
          <CheckCircle2 size={12} />
          {t('doctorCms.selectedPlan')}
        </span>
      )}
    </button>
  );
};

const DoctorPremium = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.user);

  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadPremium = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const [quoteRes, statusRes] = await Promise.allSettled([
      getSubscriptionQuote(),
      fetchSubscriptionStatus()
    ]);

    if (quoteRes.status === 'fulfilled' && quoteRes.value?.quote) {
      setQuote(quoteRes.value.quote);
      setSelectedPlan((current) => getPreferredSubscriptionPlan(quoteRes.value.quote, current) || current);
    }
    if (statusRes.status === 'fulfilled' && statusRes.value?.success) {
      setStatus(statusRes.value);
    }
    if (quoteRes.status === 'rejected' && statusRes.status === 'rejected') {
      setLoadError(t('doctorCms.premiumLoadError') || 'Failed to load premium information.');
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    loadPremium();
  }, [loadPremium]);

  const plans = useMemo(() => getRenderableSubscriptionPlans(quote), [quote]);
  const selectedPlanDetails = plans.find((plan) => plan.id === selectedPlan) || plans[0] || null;
  const isActive = status?.active === true;
  const subscription = status?.subscription || null;

  const benefits = [
    { icon: BarChart3, text: t('doctorCms.premiumBenefitAnalytics') || 'Profile Performance analytics based on real booking and consultation activity' },
    { icon: Eye, text: t('doctorCms.premiumBenefitVisibility') || 'Priority visibility for HomelyServ members' },
    { icon: CalendarCheck, text: t('doctorCms.premiumBenefitRequests') || 'Unlimited appointment request handling' },
    { icon: FileText, text: t('doctorCms.premiumBenefitWorkflow') || 'Full consultation and prescription workflow' },
    { icon: ShieldCheck, text: t('doctorCms.premiumBenefitSupport') || 'Priority HomelyServ support' }
  ];

  const planLabel = (planId) => t(PLAN_LABEL_KEYS[planId] || PLAN_LABEL_KEYS.monthly);

  return (
    <DashboardLayout requiredRole="DOCTOR">
      {/* Same red top header as the Doctor Dashboard — reused, not re-created. */}
      <DashboardHeader title={t('doctorNav.premium') || 'Premium'} />

      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        <RolePageHeader
          icon={Crown}
          title={t('doctorCms.premiumTitle') || 'Doctor Premium'}
          subtitle={t('doctorCms.premiumSubtitle')
            || 'Unlock premium visibility, analytics, and full clinic workflow tools for your HomelyServ practice.'}
        />

        {loadError && (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-4">
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{loadError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ---- Plans (server-authoritative pricing) ---- */}
          <section className="lg:col-span-2 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={18} className="text-red-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t('doctorCms.premiumPlansTitle') || 'Available billing periods'}
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t('doctorCms.premiumPlansSubtitle')
                  || 'Prices are set by HomelyServ for the Doctor account context.'}
              </p>

              {loading ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 size={22} className="animate-spin" />
                </div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                  {t('doctorCms.noPlansAvailable') || 'No plans are available right now.'}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      active={plan.id === selectedPlan}
                      label={planLabel(plan.id)}
                      onSelect={setSelectedPlan}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ---- Benefits ---- */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                {t('doctorCms.premiumBenefitsTitle') || 'Doctor Premium benefits'}
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <li
                      key={benefit.text}
                      className="flex items-start gap-2.5 rounded-xl border border-gray-100 dark:border-gray-700 p-3"
                    >
                      <Icon size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{benefit.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* ---- Current subscription state ---- */}
          <aside className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                {t('doctorCms.premiumStateTitle') || 'Current subscription'}
              </h2>

              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {isActive
                    ? t('doctorCms.premiumActive') || 'Active'
                    : t('doctorCms.premiumInactive') || 'Not active'}
                </span>
              </div>

              {subscription && (
                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">
                      {t('doctorCenter.currentPlan')}
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {planLabel(subscription.plan)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-gray-500 dark:text-gray-400">
                      {t('doctorCenter.expiresOn')}
                    </dt>
                    <dd className="font-medium text-gray-900 dark:text-white">
                      {formatDate(subscription.currentPeriodEnd || subscription.expiresAt, i18n.language)}
                    </dd>
                  </div>
                </dl>
              )}

              <button
                type="button"
                disabled={loading || !selectedPlanDetails}
                onClick={() => navigate('/subscription')}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 transition-colors"
              >
                <Crown size={16} />
                {isActive
                  ? t('doctorCenter.renew') || 'Renew'
                  : t('doctorCms.premiumSubscribe') || 'Subscribe'}
              </button>

              <p className="mt-3 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
                {t('doctorCms.premiumRedirectNote')
                  || 'Checkout, payment, and activation are handled by the existing HomelyServ subscription flow.'}
              </p>
            </div>

            <p className="px-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">
              {t('doctorCenter.workerPricingNote')}
            </p>
          </aside>
        </div>

        {/* ---- Active subscription + history (existing shared component) ---- */}
        <PremiumSubscriptionSection />
      </div>
    </DashboardLayout>
  );
};

export default DoctorPremium;

