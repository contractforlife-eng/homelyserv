// src/pages/Subscription.jsx - UPDATED WITH PAYMOB & PAYPAL + PREMIUM DESIGN + WORKING NOTIFICATIONS
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuthStore from '../store/authStore';
import { applyBackendSubscription } from '../utils/subscriptionService';
import { capturePayPalOrder, fetchSubscriptionStatus, getPaymentStatus, getSubscriptionQuote, isTerminalPayPalCaptureResult } from "../services/paymentService";
import {
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  Crown,
  CreditCard,
  Wallet,
  ArrowLeft,
  X,
  Smartphone,
  Building2
} from 'lucide-react';
import {
  createSubscription,
  getUserSubscription,
  getSubscriptionStatus
} from '../utils/subscriptionService';
import { createPaymobPayment, createPayPalOrder } from '../services/paymentService';
import { PAYMENT_METHODS, PAYMOB_ENABLED } from '../config/paymentConfig';
import ManualPaymentFlow from '../components/Payment/ManualPaymentFlow';
import BankTransferFlow from '../components/Payment/BankTransferFlow';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import RolePageHeader from '../components/common/RolePageHeader';
import { canShowEgyptianManualPaymentMethods } from '../utils/egyptianPaymentVisibility';
import {
  formatSubscriptionAmount,
  getRenderableSubscriptionPlans,
  getPreferredSubscriptionPlan,
  isSubscriptionPlanPurchaseEnabled
} from '../utils/subscriptionQuotePresentation';

// ============================================================
// MAIN SUBSCRIPTION COMPONENT - WITH WORKING NOTIFICATIONS
// ============================================================
const Subscription = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.isLoading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  const { t } = useTranslation();

  const [isEmployer, setIsEmployer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [paymobIframe, setPaymobIframe] = useState(null);
  const [retryableStatus, setRetryableStatus] = useState(false);
  const [manualPaymentSubmitted, setManualPaymentSubmitted] = useState(false);
  const [subscriptionQuote, setSubscriptionQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState(null);

  // Guard against duplicate PayPal capture responses triggering duplicate
  // UI refresh/purchase cycles (polling + popup-return can both fire).
  const subscriptionProcessedRef = useRef(false);
  const paypalPollingRef = useRef(null);
  const paypalAttemptKeyRef = useRef(null);

  const userRole = isEmployer ? 'EMPLOYER' : 'WORKER';
  const selectedPlanQuote = subscriptionQuote?.plans?.[selectedPlan] || null;
  const price = selectedPlanQuote?.amount ?? null;
  const selectedPlanPurchasable = isSubscriptionPlanPurchaseEnabled(subscriptionQuote, selectedPlan);
  const genericMarketGateRequired = selectedMethod === PAYMENT_METHODS.VODAFONE_CASH
    || selectedMethod === PAYMENT_METHODS.INSTAPAY;
  const selectedMethodCheckoutEnabled = selectedMethod === PAYMENT_METHODS.PAYPAL
    || selectedMethod === PAYMENT_METHODS.BANK_TRANSFER
    || (genericMarketGateRequired && selectedPlanPurchasable);
  const quotePlans = getRenderableSubscriptionPlans(subscriptionQuote);

  const loadSubscriptionQuote = async () => {
    setQuoteLoading(true);
    setQuoteError(null);
    try {
      const response = await getSubscriptionQuote();
      if (!response?.success || !response.quote) throw new Error('Invalid subscription quote');
      setSubscriptionQuote(response.quote);
      setSelectedPlan((currentPlan) => getPreferredSubscriptionPlan(response.quote, currentPlan) || currentPlan);
    } catch (error) {
      console.warn('Could not load subscription quote:', error);
      setSubscriptionQuote(null);
      setQuoteError(t('subscriptionPlanOptions.quoteLoadFailed'));
    } finally {
      setQuoteLoading(false);
    }
  };


  // Payment Methods - PAYMOB disabled, PAYPAL + MANUAL
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: t('subscriptionPage.methods.paypal'),
      icon: Wallet,
      description: t('subscriptionPage.methods.paypalDesc'),
      color: 'from-blue-700 to-blue-800',
      badge: null,
      badgeColor: null
    },
    {
      id: PAYMENT_METHODS.VODAFONE_CASH,
      name: t('manualPayment.vodafoneCash'),
      icon: Smartphone,
      description: t('manualPayment.egyptOnly') + ' - ' + t('manualPayment.pendingWarning'),
      color: 'from-red-500 to-red-600',
      badge: t('manualPayment.manualVerification'),
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    {
      id: PAYMENT_METHODS.INSTAPAY,
      name: t('manualPayment.instapay'),
      icon: Building2,
      description: t('manualPayment.egyptOnly') + ' - ' + t('manualPayment.pendingWarning'),
      color: 'from-blue-500 to-blue-600',
      badge: t('manualPayment.manualVerification'),
      badgeColor: 'bg-amber-100 text-amber-700'
    },
    {
      id: PAYMENT_METHODS.BANK_TRANSFER,
      name: t('bankTransfer.category'),
      icon: Building2,
      description: t('bankTransfer.description'),
      color: 'from-teal-500 to-teal-600',
      badge: t('bankTransfer.available'),
      badgeColor: 'bg-green-100 text-green-700'
    }
  ];
  const visiblePaymentMethods = canShowEgyptianManualPaymentMethods(authUser)
    ? paymentMethods
    : paymentMethods.filter(({ id }) => (
      id !== PAYMENT_METHODS.VODAFONE_CASH && id !== PAYMENT_METHODS.INSTAPAY
    ));
  const planVisiblePaymentMethods = selectedPlan === 'annual'
    ? visiblePaymentMethods.filter(({ id }) => id === PAYMENT_METHODS.PAYPAL || id === PAYMENT_METHODS.BANK_TRANSFER)
    : visiblePaymentMethods;

  useEffect(() => {
    paypalAttemptKeyRef.current = null;
  }, [selectedPlan, authUser?.id]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    const isEmployerRole = authUser.role === 'EMPLOYER';
    setIsEmployer(isEmployerRole);

    // Fast first paint from the localStorage mirror, then ALWAYS reconcile
    // against the authoritative backend row (MongoDB via ensureSubscription).
    // Backend status wins — localStorage must never override it.
    const userId = authUser.id || authUser.email;
    const localStatus = getSubscriptionStatus(userId);
    if (localStatus.active) {
      setCurrentSubscription(getUserSubscription(userId));
      setSubscriptionStatus(localStatus);
      setPaymentSuccess(true);
    }

    (async () => {
      try {
        await Promise.all([loadSubscriptionQuote(), fetchSubscriptionStatus().then((res) => {
          if (res && res.success) applyBackendSubscriptionState(res);
        })]);
      } catch (statusError) {
        console.warn('Could not refresh subscription status on mount:', statusError);
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, isAuthenticated, authLoading, navigate]);

  // Handle Paymob iframe message
  const handlePaymobMessage = (event) => {
    if (event.data?.type === 'PAYMENT_COMPLETE') {
      setPaymentSuccess(true);
      setProcessing(false);
      setPaymobIframe(null);
      window.removeEventListener('message', handlePaymobMessage);
      
      // Process successful subscription
      processSuccessfulSubscription(event.data);
    }
  };

  const processSuccessfulSubscription = (paymentData) => {
    try {
      if (!selectedPlanQuote) throw new Error('Subscription quote unavailable');
      const userId = authUser.id || authUser.email;
      const userRole = isEmployer ? 'EMPLOYER' : 'WORKER';
      
      const subscription = createSubscription(
        userId,
        authUser.email,
        userRole,
        authUser.fullName || (isEmployer ? 'Employer' : 'Worker'),
        selectedPlan
      );

      if (subscription) {
        setCurrentSubscription(subscription);
        setPaymentSuccess(true);
        
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, isPremium: true, subscriptionActive: true };
          useAuthStore.setState({ user: updatedUser });
        }
        
        const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
        const userIndex = users.findIndex(u => u.email === authUser.email);
        if (userIndex !== -1) {
          users[userIndex].isPremium = true;
          users[userIndex].subscriptionActive = true;
          localStorage.setItem('homelyserv_users', JSON.stringify(users));
        }
        
        const profiles = JSON.parse(localStorage.getItem('homelyserv_profiles') || '{}');
        if (profiles[authUser.email]) {
          profiles[authUser.email].isPremium = true;
          profiles[authUser.email].subscriptionActive = true;
          localStorage.setItem('homelyserv_profiles', JSON.stringify(profiles));
        }
        
        const receipt = {
          id: 'SUB-REC-' + Date.now(),
          userId: userId,
          userEmail: authUser.email,
          userRole: userRole,
          amount: selectedPlanQuote.amount,
          currency: selectedPlanQuote.currency,
          paymentMethod: selectedMethod,
          transactionId: paymentData.transactionId || subscription.transactionId,
          date: new Date().toISOString(),
          status: 'completed',
          subscriptionId: subscription.id || subscription.transactionId
        };
        
        const receipts = JSON.parse(localStorage.getItem('subscription_receipts') || '[]');
        receipts.push(receipt);
        localStorage.setItem('subscription_receipts', JSON.stringify(receipts));
        
        setSubscriptionStatus({
          active: true,
          status: 'active',
          message: 'Active',
          daysLeft: selectedPlanQuote.durationDays,
          expiresAt: subscription.expiresAt
        });
      }
    } catch (error) {
      console.error('Error processing subscription:', error);
      setPaymentError(t('subscriptionPage.payment.processFailed'));
    }
  };

  const computeDaysLeft = (endDate) => {
    if (!endDate) return null;
    const diff = new Date(endDate) - new Date();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // Apply a BACKEND-refreshed subscription state to the UI + localStorage
  // mirror. The backend (MongoDB via ensureSubscription) is authoritative;
  // localStorage only mirrors it and never overrides it.
  const applyBackendSubscriptionState = (backendStatus) => {
    const userId = authUser?.id || authUser?.email;
    const subscription = backendStatus?.subscription;
    const isActive =
      !!subscription &&
      subscription.status === 'active' &&
      subscription.endDate &&
      new Date(subscription.endDate) > new Date();

    if (userId && subscription) {
      applyBackendSubscription(userId, authUser?.email, subscription);
    }

    setCurrentSubscription(subscription ? { ...subscription, expiresAt: subscription.endDate } : null);

    if (isActive) {
      setSubscriptionStatus({
        active: true,
        status: 'active',
        message: 'Active',
        daysLeft: computeDaysLeft(subscription.endDate),
        expiresAt: subscription.endDate
      });
      setProcessing(false);
      setRetryableStatus(false);
      setPaymentSuccess(true);
    } else {
      setSubscriptionStatus({ active: false, status: 'inactive', message: 'No active subscription' });
      setPaymentSuccess(false);
    }
  };

  // Bounded backend subscription-status poll — NEVER infinite.
  // Used after a successful capture (backend may still be committing the
  // fulfillment) and by the manual "check again" retry.
  const refreshSubscriptionStatus = async ({ attempts = 4, intervalMs = 1500 } = {}) => {
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const res = await fetchSubscriptionStatus();
        if (res && res.success && res.isPremium && res.subscription) {
          applyBackendSubscriptionState(res);
          return true;
        }
      } catch (refreshError) {
        console.warn(`Subscription status refresh attempt ${attempt + 1} failed:`, refreshError);
      }
      if (attempt < attempts - 1) {
        await new Promise(r => setTimeout(r, intervalMs));
      }
    }
    return false;
  };

  const handleSubscribe = async () => {
    if (!selectedMethod) {
      setPaymentError(t('subscriptionPage.payment.selectMethodError'));
      return;
    }

    if (!authUser) {
      setPaymentError(t('subscriptionPage.payment.userNotFound'));
      return;
    }

    if (!selectedPlanQuote || (genericMarketGateRequired && !selectedPlanPurchasable)) {
      setPaymentError(t('subscriptionPlanOptions.purchaseComingSoon'));
      return;
    }

    if (selectedMethod === PAYMENT_METHODS.VODAFONE_CASH || selectedMethod === PAYMENT_METHODS.INSTAPAY) {
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    setRetryableStatus(false);
    subscriptionProcessedRef.current = false;

    try {
      const orderId = 'SUB-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const customerData = {
        firstName: authUser?.fullName?.split(' ')[0] || 'Customer',
        lastName: authUser?.fullName?.split(' ').slice(1).join(' ') || 'User',
        email: authUser?.email || 'customer@homelyserv.com',
        phone: authUser?.phone || '+201234567890',
        country: 'EG',
        city: 'Cairo',
        items: [
          {
            name: isEmployer ? 'Employer Premium Subscription' : 'Worker Premium Subscription',
            amount: price,
            quantity: 1
          }
        ]
      };

      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        const result = await createPaymobPayment(price, orderId, customerData, { purpose: 'SUBSCRIPTION', plan: selectedPlan });
        
        if (result.success) {
          setPaymobIframe(result.iframeUrl);
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || t('subscriptionPaymentErrors.paymobFailed'));
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        if (!paypalAttemptKeyRef.current) {
          paypalAttemptKeyRef.current = globalThis.crypto?.randomUUID?.()
            || `attempt-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
        }
        let result;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          result = await createPayPalOrder(price, orderId, customerData, {
            purpose: 'SUBSCRIPTION',
            plan: selectedPlan,
            attemptKey: paypalAttemptKeyRef.current,
          });
          if (result?.success || result?.code !== 'PAYPAL_SUBSCRIPTION_PREPARING' || attempt === 2) break;
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        
        if (result.success) {
          window.open(result.approvalUrl, '_blank');
          startPollingPayPalOrder(result.paypalOrderId);
        } else {
          throw new Error(result.error || t('subscriptionPaymentErrors.paypalFailed'));
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message);
      setProcessing(false);
    }
  };

  // ============================================================
  // PAYPAL POPUP RETURN HANDLER
  // ============================================================
  // When PayPal redirects back to /payment-success or /payment-cancel,
  // the popup posts a message here so we can stop polling.
  const handlePayPalReturnMessage = (event) => {
    if (event.data?.type === 'PAYPAL_RETURN') {
      console.log('✅ PayPal popup returned:', event.data);
      if (!event.data.success) {
        if (paypalPollingRef.current) {
          clearInterval(paypalPollingRef.current);
          paypalPollingRef.current = null;
        }
        setProcessing(false);
        setPaymentError(t('paymentCancel.cancelled'));
        return;
      }
      // The popup is closing - the polling will capture the payment
      if (event.data.success) {
        setPaymentError(null);
      }
    }
  };

  const startPollingPayPalOrder = (orderId) => {
    let attempts = 0;
    const maxAttempts = 30;

    const stopPolling = () => {
      if (paypalPollingRef.current) {
        clearInterval(paypalPollingRef.current);
        paypalPollingRef.current = null;
      }
    };

    stopPolling();
    paypalPollingRef.current = setInterval(async () => {
      attempts++;

      // A duplicate capture response after this order was already processed
      // must NOT trigger a second UI purchase / refresh cycle.
      if (subscriptionProcessedRef.current) {
        stopPolling();
        return;
      }

      try {
        const statusResult = await getPaymentStatus(orderId);
        const providerState = statusResult?.payment?.providerState;

        if (providerState === 'TERMINAL') {
          stopPolling();
          subscriptionProcessedRef.current = true;
          setPaymentError(t('paypalCaptureErrors.terminal'));
          setRetryableStatus(false);
          setProcessing(false);
          return;
        }

        if (!['APPROVED', 'COMPLETED'].includes(providerState)) {
          if (attempts >= maxAttempts) {
            stopPolling();
            setPaymentError(t('subscriptionPage.payment.verificationTimeout'));
            setProcessing(false);
          }
          return;
        }

        // The status came from a server-to-server PayPal lookup. The capture
        // endpoint re-verifies it before capture and canonical fulfillment.
        stopPolling();
        subscriptionProcessedRef.current = true;
        const result = await capturePayPalOrder(orderId);

        if (result.success) {
          // Backend already captured AND fulfilled (SUBSCRIPTION -> Premium
          // activated via ensureSubscription). Do NOT wait for the PayPal order
          // to reach COMPLETED — read our authoritative backend status instead.
          // Brief bounded refresh (4 tries x 1.5s — never infinite) so the
          // backend commit is fully visible before declaring success.
          const active = await refreshSubscriptionStatus({ attempts: 4, intervalMs: 1500 });

          if (!active) {
            // Capture succeeded but the entitlement row is not visible yet.
            // Show a retryable message — never auto-create/capture a new payment.
            setProcessing(false);
            setPaymentError(t('subscriptionPage.payment.activationRetry'));
            setRetryableStatus(true);
          }
        } else if (isTerminalPayPalCaptureResult(result)) {
          setPaymentError(t('paypalCaptureErrors.terminal'));
          setRetryableStatus(false);
          setProcessing(false);
        } else {
          setPaymentError(t('subscriptionPage.payment.verificationFailed'));
          setProcessing(false);
        }
      } catch (error) {
        console.error('PayPal polling error:', error);
        stopPolling();
        setPaymentError(t('subscriptionPage.payment.verificationFailed'));
        setProcessing(false);
      }
    }, 3000);
  };

  // Manual, read-only retry shown if activation needs a re-check after a
  // successful capture. It never creates or captures a new payment.
  const checkStatusManually = async () => {
    setProcessing(true);
    setPaymentError(null);
    const active = await refreshSubscriptionStatus({ attempts: 4, intervalMs: 1200 });
    if (!active) {
      setProcessing(false);
      setPaymentError(t('subscriptionPage.payment.activationRetry'));
      setRetryableStatus(true);
    }
  };

  const handleManualProofSubmitted = () => {
    setManualPaymentSubmitted(true);
    setProcessing(false);
  };

  const handleGoBack = () => {
    navigate(isEmployer ? '/employer-dashboard' : '/worker-dashboard');
  };

  // Cleanup
  useEffect(() => {
    // Listen for PayPal popup return messages
    window.addEventListener('message', handlePayPalReturnMessage);
    return () => {
      if (paypalPollingRef.current) {
        clearInterval(paypalPollingRef.current);
        paypalPollingRef.current = null;
      }
      window.removeEventListener('message', handlePaymobMessage);
      window.removeEventListener('message', handlePayPalReturnMessage);
    };
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardHeader
          title={t('subscriptionPage.title')}
          notificationUserId={authUser?.id || authUser?.email}
        />
        <RolePageHeader title={t('subscriptionPage.title')} subtitle={t('subscriptionPage.subtitle')} />
        <div className="p-4 md:p-6 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">{t('subscriptionPage.loading')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!authUser) {
    return null;
  }

  return (
    <DashboardLayout>
      <DashboardHeader
        title={t('subscriptionPage.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />
      <RolePageHeader title={t('subscriptionPage.title')} subtitle={t('subscriptionPage.subtitle')} />
      <div className="p-4 md:p-6">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={18} />
          {t('subscriptionPage.back')}
        </button>

          {paymentSuccess ? (
            // Success State
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-2xl mx-auto text-center border border-green-100">
              <div className="w-28 h-28 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle size={56} className="text-white" />
              </div>
              <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-3">{t('subscriptionPage.payment.success')}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg mb-8">{t('subscriptionPage.payment.successMessage')}</p>
              
              <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 mb-8 border border-yellow-200">
                <div className="flex items-center gap-4 justify-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-md">
                    <Crown size={28} className="text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-white text-lg">
                      {isEmployer ? t('subscriptionPage.roles.employerPremium') : t('subscriptionPage.roles.workerPremium')}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{t('subscriptionPage.activeSubscription')}</p>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">{t('subscriptionPage.status.active')}</span>
                </div>
                {currentSubscription?.expiresAt && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-3">
                    {t('subscriptionPage.status.expiresAt', { date: new Date(currentSubscription.expiresAt).toLocaleDateString() })}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleGoBack}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  {t('subscriptionPage.goToDashboard')}
                </button>
              </div>
            </div>
          ) : (
            // Subscription Form
            <div className="max-w-6xl mx-auto">
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-700 dark:text-yellow-400 text-sm font-semibold mb-4">
                  <Sparkles size={16} />
                  {t('subscriptionPage.premiumFeatures')}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
                  {t('subscriptionPage.unlock')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600">{t('subscriptionPage.premium')}</span> {t('subscriptionPage.features')}
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {t('subscriptionPage.heroSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 xl:gap-8">
                {/* Pricing Card - Takes 3/7 of the space */}
                <div className="lg:col-span-3 min-w-0">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700 sticky top-24">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Crown size={36} className="text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t('subscriptionPlanOptions.choosePlan')}</h3>
                      <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('subscriptionPage.pricing.description')}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 items-stretch" dir="ltr">
                        {quoteLoading ? (
                          <div className="col-span-full py-6 text-center text-gray-500">{t('subscriptionPage.loading')}</div>
                        ) : quoteError ? (
                          <div className="col-span-full py-4 text-center">
                            <p className="text-red-600 mb-3">{quoteError}</p>
                            <button type="button" onClick={loadSubscriptionQuote} className="px-4 py-2 rounded-lg bg-purple-600 text-white">
                              {t('subscriptionPlanOptions.retry')}
                            </button>
                          </div>
                        ) : quotePlans.map((plan) => (
                          <button
                            type="button"
                            key={plan.id}
                            disabled={processing}
                            onClick={() => {
                              setSelectedPlan(plan.id);
                              if (plan.id === 'annual' && plan.purchaseEnabled === true) {
                                setSelectedMethod(PAYMENT_METHODS.PAYPAL);
                              } else if (plan.purchaseEnabled !== true) {
                                setSelectedMethod(null);
                              }
                            }}
                            className={`relative h-full min-h-[142px] min-w-0 rounded-xl border-2 p-2 sm:p-3 text-center transition-all flex flex-col items-center justify-start ${plan.id === 'annual' ? 'border-violet-400 bg-violet-50/80 dark:border-violet-500 dark:bg-violet-900/30' : 'border-gray-200 dark:border-gray-700'} ${selectedPlan === plan.id ? 'ring-2 ring-purple-400 ring-offset-1' : ''}`}
                          >
                            {plan.id === 'annual' && <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">{t('subscriptionPlanOptions.bestValue')}</span>}
                            <span className="flex min-h-[48px] items-center justify-center font-semibold text-gray-800 dark:text-white">{t(`subscriptionPlanOptions.plans.${plan.id}`)}</span>
                            <span className="flex min-h-[28px] items-center justify-center whitespace-nowrap text-lg sm:text-xl font-bold text-purple-600">{formatSubscriptionAmount(plan.amount, plan.currency)}</span>
                            <span className="block min-h-[20px] text-sm text-gray-500">{t('subscriptionPlanOptions.durationDays', { days: plan.durationDays })}</span>
                            <span className="block min-h-[16px] mt-1">&nbsp;</span>
                          </button>
                        ))}
                      </div>
                      {!quoteLoading && !quoteError && selectedPlanQuote && (
                        <div className="mt-5">
                          <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-purple-600">{formatSubscriptionAmount(selectedPlanQuote.amount, selectedPlanQuote.currency)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {(isEmployer ? t('subscriptionPage.pricing.employerFeatures', { returnObjects: true }) : t('subscriptionPage.pricing.workerFeatures', { returnObjects: true })).map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                          <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {subscriptionStatus?.active && (
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-200">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle size={18} />
                          <span className="font-semibold">{t('subscriptionPage.status.active')}</span>
                          <span className="text-sm text-green-600">
                            ({t('subscriptionPage.status.daysLeft', { days: subscriptionStatus.daysLeft })})
                          </span>
                        </div>
                        {subscriptionStatus.expiresAt && (
                          <p className="text-xs text-green-600 mt-1">
                            {t('subscriptionPage.status.expiresAt', { date: new Date(subscriptionStatus.expiresAt).toLocaleDateString() })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Form - Takes 3/5 of the space */}
                <div className="lg:col-span-4 min-w-0">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('subscriptionPage.payment.title')}</h3>
                    
                    {paymentError && (
                      <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-2xl text-red-600 flex items-start gap-3">
                        <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span>{paymentError}</span>
                          {retryableStatus && (
                            <button
                              onClick={checkStatusManually}
                              disabled={processing}
                              className="mt-3 flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                            >
                              {processing && <Loader2 size={16} className="animate-spin" />}
                              {t('subscriptionPage.payment.checkStatusAgain')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 mb-8">
                      <p className="font-medium text-gray-700 dark:text-gray-300">{t('subscriptionPage.payment.chooseMethod')}</p>
                      {planVisiblePaymentMethods.map((method) => {
                        const isSelected = selectedMethod === method.id;
                        const Icon = method.icon;
                        const isManual = method.id === PAYMENT_METHODS.VODAFONE_CASH || method.id === PAYMENT_METHODS.INSTAPAY;
                        return (
                          <div
                            key={method.id}
                            onClick={() => {
                              if (processing || manualPaymentSubmitted) return;
                              setSelectedMethod(method.id);
                              setPaymentError(null);
                            }}
                            className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${(
                              isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                            )} ${processing || manualPaymentSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Icon size={28} className="text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-gray-800 dark:text-white text-lg">{method.name}</p>
                                  {method.badge && (
                                    <span className={`px-2.5 py-1 ${method.badgeColor} text-xs font-semibold rounded-full`}>
                                      {method.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{method.description}</p>
                              </div>
                              {isSelected && (
                                <CheckCircle size={28} className="text-purple-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {selectedMethod === PAYMENT_METHODS.BANK_TRANSFER ? (
                      <BankTransferFlow
                        purpose="SUBSCRIPTION"
                        plan={selectedPlan}
                        onCancel={() => setSelectedMethod(null)}
                      />
                    ) : selectedPlanPurchasable && (selectedMethod === PAYMENT_METHODS.VODAFONE_CASH || selectedMethod === PAYMENT_METHODS.INSTAPAY) ? (
                      <ManualPaymentFlow
                        paymentMethod={selectedMethod}
                        purpose="SUBSCRIPTION"
                        plan={selectedPlan}
                        onSubmitted={handleManualProofSubmitted}
                        onCancel={() => setSelectedMethod(null)}
                      />
                    ) : (
                      <button
                        onClick={handleSubscribe}
                        disabled={processing || !selectedMethod || quoteLoading || !!quoteError || !selectedMethodCheckoutEnabled}
                        className={`w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 ${(
                          processing || !selectedMethod || quoteLoading || !!quoteError || !selectedMethodCheckoutEnabled
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-xl hover:scale-[1.02] transform transition-all'
                        )}`}
                      >
                        {processing ? (
                          <>
                            <Loader2 size={22} className="animate-spin" />
                            {t('subscriptionPage.payment.processing')}
                          </>
                        ) : (
                          <>
                            <Crown size={22} />
                            {selectedMethodCheckoutEnabled ? t('subscriptionPage.payNow') : t('subscriptionPlanOptions.purchaseComingSoon')}
                          </>
                        )}
                      </button>
                    )}

                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center mt-4">
                      {t('subscriptionPage.securePayment')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Paymob Iframe Modal */}
      {paymobIframe && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('subscriptionPage.payWithPaymob')}</h3>
              <button
                onClick={() => {
                  setPaymobIframe(null);
                  setProcessing(false);
                  window.removeEventListener('message', handlePaymobMessage);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 h-[500px]">
              <iframe
                src={paymobIframe}
                className="w-full h-full border-0"
                allow="payment"
                title={t('subscriptionPage.paymobPaymentTitle')}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Subscription;
