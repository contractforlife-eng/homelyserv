// src/pages/PaymentSuccess.jsx
// PayPal return callback page - verifies payment status and redirects.
// NOTE: This page is NOT the primary payment processor.
// The existing polling mechanism (PaymentOptions.jsx / Subscription.jsx)
// captures the payment, updates status, and activates Premium.
// This page only verifies the result and provides a clean UX after PayPal redirects back.
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, X } from 'lucide-react';
import { capturePayPalOrder, getPaymentStatus } from '../services/paymentService';
import useAuthStore from '../store/authStore';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [status, setStatus] = useState('verifying'); // verifying | success | error
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [destination, setDestination] = useState('/employer-dashboard');
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const authLoading = useAuthStore(state => state.isLoading);
  const verificationRunRef = useRef(0);
  const closeTimeoutRef = useRef(null);
  const captureRequestedRef = useRef(false);

  // Determine where to redirect based on payment source
  const determineDestination = () => {
    // Check if this was a subscription payment
    const pendingPayment = JSON.parse(localStorage.getItem('homelyserv_pending_payment') || 'null');
    const orderId = localStorage.getItem('homelyserv_paypal_order_id');

    // If we have a pending payment with hireId, it's a hiring/commission payment
    if (pendingPayment?.hireId) {
      return '/my-hires';
    }

    // If we have a subscription order (SUB- prefix), go to subscription
    if (orderId?.startsWith('SUB-')) {
      return '/subscription';
    }

    // Default based on user role
    const role = authUser?.role?.toUpperCase();
    if (role === 'WORKER') return '/worker-dashboard';
    if (role === 'EMPLOYER') return '/employer-dashboard';
    if (role === 'ADMIN') return '/admin';
    if (role === 'SUPPORT') return '/support-dashboard';
    return '/login';
  };

  // Try to close the popup window if this is one
  const tryClosePopup = () => {
    try {
      // Only close if this window was opened as a popup (has an opener)
      if (window.opener && !window.opener.closed) {
        // Notify the opener that payment is complete
        window.opener.postMessage(
          { type: 'PAYPAL_RETURN', success: true },
          window.location.origin
        );
        // Close the popup after a short delay to let the message send
        closeTimeoutRef.current = setTimeout(() => window.close(), 500);
        return true;
      }
    } catch (e) {
      console.log('Could not close popup:', e);
    }
    return false;
  };

  // Verify payment status
  const verifyPayment = async (orderId) => {
    try {
      // First try to get the payment status (non-destructive)
      const statusResult = await getPaymentStatus(orderId);
      
      if (statusResult.success && statusResult.payment) {
        if (
          statusResult.payment.status === 'completed' &&
          statusResult.payment.fulfillmentStatus === 'fulfilled'
        ) {
          setStatus('success');
          setMessage(t('paymentSuccess.messages.confirmed'));
          return true;
        }
      }

      // Capture only after the read-only server status check observes a
      // provider-approved/final order. The capture endpoint re-verifies it.
      if (!['APPROVED', 'COMPLETED'].includes(statusResult?.payment?.providerState)) {
        setStatus('verifying');
        setMessage(t('paymentSuccess.messages.processing'));
        return false;
      }

      if (captureRequestedRef.current) return false;
      captureRequestedRef.current = true;
      const captureResult = await capturePayPalOrder(orderId);
      
      if (captureResult.success) {
        const completedResult = await getPaymentStatus(orderId);
        if (
          completedResult?.payment?.status === 'completed' &&
          completedResult?.payment?.fulfillmentStatus === 'fulfilled'
        ) {
          setStatus('success');
          setMessage(t('paymentSuccess.messages.confirmed'));
          return true;
        }
      }

      // Payment still pending - wait and retry
      setStatus('verifying');
      setMessage(t('paymentSuccess.messages.processing'));
      return false;
    } catch (error) {
      console.error('Payment verification error:', error);
      // Don't fail immediately - the polling in the main tab may still be processing
      setStatus('verifying');
      setMessage(t('paymentSuccess.messages.processing'));
      return false;
    }
  };

  useEffect(() => {
    // A cold provider return restores the persisted token/authenticated flag
    // before checkAuth() restores the User. Wait for that existing auth
    // lifecycle to resolve so a temporarily-null User cannot freeze the
    // success destination as /login.
    if (authLoading) {
      return;
    }

    // Redirect only after authentication has definitively resolved.
    if (!isAuthenticated || !authUser) {
      navigate('/login', { replace: true });
      return;
    }

    const params = new URLSearchParams(location.search);
    const token = params.get('token'); // PayPal order ID
    const payerId = params.get('PayerID');
    
    // Get order ID from localStorage (set by PaymentOptions/Subscription)
    const storedOrderId = localStorage.getItem('homelyserv_paypal_order_id');
    const orderId = token || storedOrderId;

    if (!orderId) {
      setStatus('error');
      setMessage(t('paymentSuccess.messages.referenceNotFound'));
      return;
    }

    // Determine destination
    setDestination(determineDestination());

    const isPopup = Boolean(window.opener && !window.opener.closed);
    captureRequestedRef.current = false;
    const runId = ++verificationRunRef.current;
    let retryTimeout = null;

    // Verify payment status
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkPayment = async () => {
      attempts++;
      const verified = await verifyPayment(orderId);

      if (verificationRunRef.current !== runId) return;
      
      if (verified) {
        if (isPopup) tryClosePopup();
        // Success - redirect after countdown
        setCountdown(3);
        return;
      }
      
      if (attempts >= maxAttempts) {
        setStatus('error');
        setMessage(t('paymentSuccess.messages.unableToVerify'));
        return;
      }
      
      // Retry after 2 seconds
      retryTimeout = setTimeout(checkPayment, 2000);
    };

    checkPayment();

    // Cleanup
    return () => {
      verificationRunRef.current++;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      // Clear the stored order ID after verification
      // (but keep it if popup is still open - the main tab needs it)
      if (!isPopup) {
        localStorage.removeItem('homelyserv_paypal_order_id');
        localStorage.removeItem('homelyserv_paypal_approval_url');
      }
    };
  }, [location.search, isAuthenticated, authLoading, authUser, navigate]);

  // Countdown and redirect
  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (status === 'success' && countdown === 0) {
      // Redirect to destination
      navigate(destination, { replace: true });
    }
  }, [status, countdown, destination, navigate]);

  // Render
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-200 dark:border-gray-700">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 size={32} className="text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('paymentSuccess.verifyingTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{message || t('paymentSuccess.verifyingFallback')}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              {t('paymentSuccess.safeCloseProcessing')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('paymentSuccess.successTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t('paymentSuccess.premiumActivated')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('paymentSuccess.redirectingIn', { count: countdown })}
            </p>
            <button
              onClick={() => navigate(destination, { replace: true })}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition"
            >
              {t('paymentSuccess.continueNow')}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
              {t('paymentSuccess.safeClose')}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('paymentSuccess.issueTitle')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/employer-payments')}
                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-700 transition"
              >
                {t('paymentSuccess.backToPayments')}
              </button>
              <button
                onClick={() => navigate('/subscription')}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition"
              >
                {t('paymentSuccess.checkSubscription')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
