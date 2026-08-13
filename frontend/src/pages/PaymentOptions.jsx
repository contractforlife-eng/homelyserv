// src/pages/PaymentOptions.jsx - COMPLETE WITH PAYMOB & PAYPAL INTEGRATION - FIXED
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeLanguageGlobal } from '../i18n';
import useAuthStore from '../store/authStore';
import { isUserPremium, applyBackendSubscription } from '../utils/subscriptionService';
import EmployerSidebar from '../components/employer/EmployerSidebar';
import PaymentOptionsPage from './PaymentOptions';
import { createPaymobPayment, createPayPalOrder, capturePayPalOrder, fetchSubscriptionStatus } from '../services/paymentService';
import { PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../config/paymentConfig';
import { RECRUITMENT_COMMISSION_RATE } from '../config/monetization';
import employerService from '../services/employerService';
import { formatWorkerRate } from '../utils/workerRateDisplay';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Shield,
  CheckCircle,
  Home,
  MessageCircle,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronLeft,
  ChevronRight,
  Globe,
  X,
  FileCheck,
  Search,
  AlertTriangle,
  User,
  MapPin,
  DollarSign,
  Lock,
  Star,
  Briefcase,
  Crown,
  Loader2,
  AlertCircle
} from 'lucide-react';

// ============================================================
// MAIN PAYMENT OPTIONS COMPONENT
// ============================================================
const PaymentOptions = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const language = i18n.resolvedLanguage || i18n.language || 'en';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [workerData, setWorkerData] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymobIframe, setPaymobIframe] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paypalOrderId, setPaypalOrderId] = useState(null);
  const [paypalApprovalUrl, setPaypalApprovalUrl] = useState(null);

  const displayWorkerName = workerData?.workerNameIsFallback
    ? t('sharedUserDisplay.roles.worker')
    : workerData?.workerName;
  const displayJobTitle = workerData?.desiredJobIsFallback
    ? t('paymentOptionsPage.serviceProvider')
    : workerData?.desiredJob || t('paymentOptionsPage.serviceProvider');
  const displayWorkerLocation = workerData?.workerLocationIsFallback
    ? t('paymentOptionsPage.locationNotSpecified')
    : workerData?.workerLocation || t('paymentOptionsPage.locationNotSpecified');

  // Guard against double-processing (polling + popup-return can both fire).
  const paymentProcessedRef = useRef(false);

  // Get authenticated user from authStore
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Payment Methods - ONLY PAYMOB & PAYPAL
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYMOB,
      name: 'Paymob',
      icon: CreditCard,
      description: t('paymentOptionsPage.methods.paymobDescription'),
      color: 'teal',
      badge: t('paymentOptionsPage.recommended'),
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      icon: Wallet,
      description: t('paymentOptionsPage.methods.paypalDescription'),
      color: 'blue',
      badge: null,
      badgeColor: null
    }
  ];


  // ============================================================
  // CALCULATE TOTAL
  // ============================================================
  const calculateTotal = () => {
    if (pendingPayment && pendingPayment.paymentType === "quick_hire_premium") {
      return 299;
    }

    if (pendingPayment) {
      if (Number(pendingPayment.amount) > 0) {
        return Number(pendingPayment.amount);
      }
      if (Number(pendingPayment.commission) > 0) {
        return Number(pendingPayment.commission);
      }
      if (Number(pendingPayment.fullSalary) > 0) {
        return (Number(pendingPayment.fullSalary) * RECRUITMENT_COMMISSION_RATE);
      }
    }

    if (workerData) {
      const targetSalary = Number(workerData.fullSalary || workerData.salary);
      if (targetSalary > 0) {
        return Math.round(targetSalary * RECRUITMENT_COMMISSION_RATE * 100) / 100;
      }
    }

    return 0;
  };

  // ============================================================
  // SAVE HIRE RECORD
  // ============================================================
  const saveHireRecord = (worker, employer, paymentDetails) => {
    try {
      const hireRecord = {
        id: 'hire_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        workerId: worker?.workerId || worker?.workerEmail,
        workerName: worker?.workerName,
        workerEmail: worker?.workerEmail,
        workerPhone: worker?.workerPhone || '',
        workerLocation: worker?.workerLocation || 'Not specified',
        workerImage: worker?.profileImage || '',
        workerRating: worker?.rating || 4.5,
        employerId: employer?.id || employer?.email,
        employerEmail: employer?.email,
        employerName: employer?.fullName || 'Employer',
        jobTitle: worker?.desiredJob || 'Service Provider',
        salary: paymentDetails?.amount || 0,
        startDate: new Date().toISOString(),
        status: 'active',
        paymentId: paymentDetails?.paymentId || null,
        transactionId: paymentDetails?.transactionId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPremium: worker?.isPremium || false
      };

      return hireRecord.id;
    } catch (error) {
      console.error('Error saving hire record:', error);
      return null;
    }
  };

  // ============================================================
  // PROCESS SUCCESSFUL PAYMENT
  // ============================================================
  const processSuccessfulPayment = async (paymentData) => {
    // Guard against double-processing (polling + popup-return can both fire).
    if (paymentProcessedRef.current) {
      console.log('⚠️ Payment already processed, skipping duplicate');
      return;
    }

    try {
      console.log('✅ Processing successful payment:', paymentData);
      const total = calculateTotal();

      const hireId = pendingPayment?.hireId;
      const paymentType = pendingPayment?.paymentType || '';

      // ============================================================
      // ROUTE BY PAYMENT METADATA — do NOT assume every payment is a hire.
      // The backend already captured the payment and activated Premium via
      // ensureSubscription. This function only drives the frontend UX.
      // ============================================================
      const isPremiumPayment =
        paymentType === 'quick_hire_premium' ||
        paymentType === 'premium' ||
        paymentType === 'subscription';

      // Premium/subscription payments are NOT tied to a Hire and must NOT
      // require a hireId. If there is no hireId and this is not a commission
      // payment, treat it as a premium/generic success instead of throwing.
      if (isPremiumPayment || !hireId) {
        console.log('👑 Premium/subscription payment detected (no hire required)');
        paymentProcessedRef.current = true;

        const userId = authUser?.id || authUser?.email;

        // The backend already captured the payment and activated Premium via
        // ensureSubscription() (MongoDB = single source of truth). Here we ONLY
        // read the real subscription status and reflect it into the UI — we do
        // NOT create or fabricate a subscription on the frontend.
        try {
          const subStatus = await fetchSubscriptionStatus();
          if (subStatus?.success && subStatus?.subscription) {
            applyBackendSubscription(userId, authUser?.email, subStatus.subscription);
          } else {
            console.warn('Backend returned no active subscription yet; premium flag will reflect on next refresh.');
          }
        } catch (readErr) {
          console.warn('Could not read subscription status from backend:', readErr);
        }

        // Clear pending data
        localStorage.removeItem('homelyserv_pending_payment');
        localStorage.removeItem('homelyserv_selected_worker');
        localStorage.removeItem('homelyserv_paypal_order_id');
        localStorage.removeItem('homelyserv_paypal_approval_url');

        setPaymentSuccess(true);
        setIsProcessing(false);
        setPaymentMessage('');

        // Premium payments → Subscription page
        setTimeout(() => {
          navigate('/subscription', { replace: true });
        }, 2000);

        return;
      }

      // ============================================================
      // HIRE / COMMISSION PAYMENT FLOW (hireId present) — unchanged
      // ============================================================
      paymentProcessedRef.current = true;

      // NOTE: The backend payment fulfillment already updates Hire/Offer state.
      // Do NOT call updateOfferStatus() here — it is a redundant frontend state
      // mutation that returns 400 because the backend already transitioned the
      // Offer/Hire. The backend is the single source of truth for Hire/Offer state.

      // Create payment record (optional localStorage mirror only — backend is authoritative)
      const paymentRecord = {
        id: 'PAY-' + Date.now(),
        offerId: pendingPayment?.offerId,
        hireId: hireId,

        workerId: workerData?.workerId || workerData?.workerEmail,
        workerName: workerData?.workerName,
        workerEmail: workerData?.workerEmail,
        jobTitle: workerData?.desiredJob || 'Service Provider',

        employerId: authUser?.id || authUser?.email,
        employerEmail: authUser?.email || '',
        employerName: authUser?.fullName || 'Employer',

        amount: total,
        status: 'completed',

        paymentMethod: selectedMethod,

        paymentType: pendingPayment?.paymentType || 'recruitment',
        type: pendingPayment?.paymentType || 'recruitment',

        transactionId: paymentData?.transactionId || 'TXN-' + Date.now(),
        paymentId: paymentData?.paymentId,
        orderId: paymentData?.orderId,

        createdAt: new Date().toISOString(),

        contactRevealed: true,
        paymentVerified: true,

        fullSalary: pendingPayment?.fullSalary || workerData?.salary || total,
        commission: total
      };

      // Helper to update, deduplicate, and bound payments cache to the latest 20 records.
      // LocalStorage failures must remain non-fatal.
      const saveBoundedPayments = (key) => {
        try {
          let payments = JSON.parse(localStorage.getItem(key) || '[]');
          if (!Array.isArray(payments)) {
            payments = [];
          }

          // Deduplicate using the best stable identifier already available in paymentRecord:
          // prefer transactionId/orderId/payment id if present.
          const newTxId = paymentRecord.transactionId && !paymentRecord.transactionId.startsWith('TXN-') ? paymentRecord.transactionId : null;
          const newOrderId = paymentRecord.orderId || null;
          const newPayId = paymentRecord.paymentId || null;

          let duplicateIndex = -1;

          if (newTxId || newOrderId || newPayId) {
            duplicateIndex = payments.findIndex(p => {
              if (newTxId && p.transactionId === newTxId) return true;
              if (newOrderId && p.orderId === newOrderId) return true;
              if (newPayId && p.paymentId === newPayId) return true;
              return false;
            });
          }

          // Fallback: match by generated transactionId even if it starts with TXN- just in case
          if (duplicateIndex === -1 && paymentRecord.transactionId) {
            duplicateIndex = payments.findIndex(p => p.transactionId === paymentRecord.transactionId);
          }

          if (duplicateIndex !== -1) {
            // Replace the old duplicate record with the new one
            payments[duplicateIndex] = { ...payments[duplicateIndex], ...paymentRecord };
          } else {
            // Add the new record
            payments.push(paymentRecord);
          }

          // Keep only the latest 20 records
          if (payments.length > 20) {
            payments = payments.slice(-20);
          }

          localStorage.setItem(key, JSON.stringify(payments));
        } catch (lsErr) {
          console.warn(`⚠️ Could not mirror payment to ${key} (non-fatal):`, lsErr);
        }
      };

      saveBoundedPayments('all_payments');
      saveBoundedPayments('employer_payments');

      // Clear pending data
      localStorage.removeItem('homelyserv_pending_payment');
      localStorage.removeItem('homelyserv_selected_worker');
      localStorage.removeItem('homelyserv_paypal_order_id');
      localStorage.removeItem('homelyserv_paypal_approval_url');

      setPaymentSuccess(true);
      setIsProcessing(false);
      setPaymentMessage('');

      // Show success and redirect
      setTimeout(() => {
        navigate('/my-hires', {
          replace: true,
          state: {
            hireSuccess: true,
            workerName: workerData?.workerName,
            hireId: hireId,
            message: `✅ Successfully hired ${workerData?.workerName}!`
          }
        });
      }, 2000);

    } catch (error) {
      // Reset the guard so a genuine failure can be retried.
      paymentProcessedRef.current = false;
      console.error('Error processing payment:', error);
      setPaymentError(t('paymentOptionsPage.errors.processingFailed'));
      setIsProcessing(false);
    }
  };

  // ============================================================
  // PAYMOB HANDLER
  // ============================================================
  const handlePaymobMessage = (event) => {
    if (event.data?.type === 'PAYMENT_COMPLETE') {
      console.log('✅ Paymob payment complete:', event.data);
      window.removeEventListener('message', handlePaymobMessage);
      processSuccessfulPayment(event.data);
    }
  };

  // ============================================================
  // PAYPAL POPUP RETURN HANDLER
  // ============================================================
  // When PayPal redirects back to /payment-success or /payment-cancel,
  // the popup posts a message here so we can stop polling and close the modal.
  const handlePayPalReturnMessage = async (event) => {
    if (event.data?.type !== 'PAYPAL_RETURN') return;

    console.log('✅ PayPal popup returned:', event.data);

    // User cancelled inside the PayPal popup
    if (!event.data.success) {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      setIsProcessing(false);
      setPaymentMessage('');
      setPaymentError(t('paymentOptionsPage.paymentCancelled'));
      return;
    }

    // Payment succeeded in the popup. The popup already captured/verified the
    // payment (idempotent on the backend). Stop polling, then run ONE final
    // capture here so the main page reaches its success state instead of
    // remaining stuck on "Finalizing...".
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    const orderId = paypalOrderId || localStorage.getItem('homelyserv_paypal_order_id');

    if (orderId && !paymentProcessedRef.current) {
      try {
        const result = await capturePayPalOrder(orderId);
        if (result.success) {
          processSuccessfulPayment(result.transaction);
          return;
        }
      } catch (err) {
        console.warn('Final capture after popup return failed:', err);
      }
    }

    // Fallback: backend already captured the payment (Premium is active),
    // so show a completion message rather than leaving the user stuck.
    setPaymentMessage(t('paymentOptionsPage.paymentCompleted'));
  };

  // ============================================================
  // PAYPAL POLLING - FIXED VERSION
  // ============================================================
  const startPollingPayPalOrder = (orderId) => {
    let attempts = 0;
    const maxAttempts = 120; // 120 attempts * 3 seconds = 6 minutes
    
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Store the order ID for manual reopening
    setPaypalOrderId(orderId);
    localStorage.setItem('homelyserv_paypal_order_id', orderId);
    
    // Set initial message
    setPaymentMessage(t('paymentOptionsPage.waitingApproval'));
    
    const interval = setInterval(async () => {
      attempts++;
      console.log(`🔄 Checking PayPal order ${orderId} (attempt ${attempts}/${maxAttempts})`);
      
      try {
        const result = await capturePayPalOrder(orderId);
        console.log('📥 PayPal capture result:', result);
        
        // Check if payment was successful
        if (result.success) {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentMessage(t('paymentOptionsPage.paymentCaptured'));
          processSuccessfulPayment(result.transaction);
          return;
        }
        
        // Check if order is approved but not yet captured
        if (result.status === 'APPROVED') {
          console.log('⏳ Order approved, attempting to capture...');
          setPaymentMessage(t('paymentOptionsPage.paymentApproved'));
          // Continue polling - next attempt will try to capture again
          return;
        }
        
        // Check if order is still pending approval
        if (result.status === 'PENDING_APPROVAL' || result.status === 'CREATED') {
          console.log('⏳ Waiting for user approval...');
          setPaymentMessage(t('paymentOptionsPage.waitingApproval'));
          // Continue polling
          return;
        }
        
        // Check for ORDER_NOT_APPROVED error
        if (result.error && (result.error.includes('ORDER_NOT_APPROVED') || result.error.includes('not approved'))) {
          console.log('⏳ Order not approved yet, waiting...');
          setPaymentMessage(t('paymentOptionsPage.waitingApproval'));
          // Continue polling - this is expected until user approves
          return;
        }
        
        // Check if we've reached max attempts
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentError(t('paymentOptionsPage.errors.verificationTimeout'));
          setIsProcessing(false);
          setPaymentMessage('');
          return;
        }
        
        // Any other error - log and continue polling
        if (result.error) {
          console.log('⚠️ PayPal error (continuing polling):', result.error);
          // Continue polling for temporary errors
        }
        
      } catch (error) {
        console.error('❌ PayPal polling error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentError(t('paymentOptionsPage.errors.verificationFailed'));
          setIsProcessing(false);
          setPaymentMessage('');
        }
      }
    }, 3000);
    
    setPollingInterval(interval);
  };

  // ============================================================
  // HANDLE PAYMENT - MAIN FUNCTION
  // ============================================================
  const handlePayment = async () => {
    if (!selectedMethod) {
      setPaymentError(t('paymentOptionsPage.selectMethod'));
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    setPaymentMessage('');

    try {
      const total = calculateTotal();
      
      if (total <= 0 || Number.isNaN(total)) {
        throw new Error(t('paymentOptionsPage.errors.invalidAmount'));
      }

      const orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      
      const customerData = {
        email: pendingPayment?.employerEmail || authUser?.email || 'employer@homelyserv.com',
        firstName: authUser?.fullName?.split(' ')[0] || 'Employer',
        lastName: authUser?.fullName?.split(' ').slice(1).join(' ') || 'User',
        phone: pendingPayment?.phone || authUser?.phone || '+201234567890',
        userId: authUser?.id || authUser?.email,
        workerId: workerData?.workerId || workerData?.workerEmail,
        workerName: workerData?.workerName,
        jobTitle: workerData?.desiredJob || pendingPayment?.jobTitle || 'Service Provider',
        employerId: authUser?.id || authUser?.email,
        employerName: authUser?.fullName || 'Employer',
        hireId: pendingPayment?.hireId,
        offerId: pendingPayment?.offerId,
        description: pendingPayment?.description || `Commission for hiring ${workerData?.workerName || 'worker'}`
      };

      console.log('📦 Customer data:', customerData);
      console.log('💰 Amount:', total);
      console.log('💳 Payment Method:', selectedMethod);

      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        // Paymob Payment
        console.log('🔄 Processing Paymob payment...');
        const result = await createPaymobPayment(total, orderId, customerData);
        console.log('📥 Paymob result:', result);
        
        if (result.success && result.iframeUrl) {
          setPaymobIframe(result.iframeUrl);
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || t('paymentOptionsPage.errors.paymobFailed'));
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        // PayPal Payment
        console.log('🔄 Processing PayPal payment...');
        const result = await createPayPalOrder(total, orderId, customerData);
        console.log('📥 PayPal result:', result);
        
        if (result.success && result.approvalUrl) {
          console.log('🔗 Opening PayPal:', result.approvalUrl);
          
          // Store the approval URL for manual reopening
          setPaypalApprovalUrl(result.approvalUrl);
          localStorage.setItem('homelyserv_paypal_approval_url', result.approvalUrl);
          localStorage.setItem('homelyserv_paypal_order_id', result.paypalOrderId || result.orderId);
          
          // Open PayPal in new window
          const paypalWindow = window.open(result.approvalUrl, '_blank', 'width=800,height=600');
          
          if (!paypalWindow || paypalWindow.closed || typeof paypalWindow.closed === 'undefined') {
            // Popup was blocked or closed
            setPaymentMessage(t('paymentOptionsPage.paypalDidNotOpen'));
            // Still start polling and show the reopen button
            startPollingPayPalOrder(result.paypalOrderId || result.orderId);
          } else {
            setPaymentMessage(t('paymentOptionsPage.paypalOpened'));
            // Start polling for payment completion
            startPollingPayPalOrder(result.paypalOrderId || result.orderId);
          }
        } else {
          throw new Error(result.error || t('paymentOptionsPage.errors.paypalFailed'));
        }
      }
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentError(error.message || t('paymentOptionsPage.paymentFailed'));
      setIsProcessing(false);
    }
  };

  // ============================================================
  // UI HELPERS
  // ============================================================
  const toggleLanguage = () => {
    const currentIndex = SUPPORTED_LANGUAGES.findIndex(item => item.code === language);
    const nextLanguage = SUPPORTED_LANGUAGES[(currentIndex + 1) % SUPPORTED_LANGUAGES.length];
    changeLanguageGlobal(nextLanguage.code);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    localStorage.setItem('sidebar_collapsed', JSON.stringify(!sidebarCollapsed));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    navigate('/login');
  };

  const handleBack = () => {
    navigate('/employer-payments');
  };

  // ============================================================
  // CLEANUP
  // ============================================================
  useEffect(() => {
    // Listen for PayPal popup return messages
    window.addEventListener('message', handlePayPalReturnMessage);
    return () => {
      window.removeEventListener('message', handlePaymobMessage);
      window.removeEventListener('message', handlePayPalReturnMessage);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // ============================================================
  // LOAD DATA
  // ============================================================
  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    // Check if user is employer
    if (authUser.role !== 'EMPLOYER') {
      navigate('/login');
      return;
    }

    const sidebarState = localStorage.getItem('sidebar_collapsed');
    if (sidebarState) {
      setSidebarCollapsed(JSON.parse(sidebarState));
    }

    // Get worker data from location state (passed from EmployerPayments)
    const workerFromState = location.state?.worker;
    if (workerFromState) {
      setWorkerData(workerFromState);
    }
    
    // Get pending payment from location state (passed from EmployerPayments)
    const pendingFromState = location.state?.pendingPayment;
    if (pendingFromState) {
      setPendingPayment(pendingFromState);
    }

    setLoading(false);
  }, [navigate, isAuthenticated, authUser]);

  // The checkout route state does not carry the advertised profile rate.
  // Fetch it for this informational display only; it never affects totals,
  // provider currency, commission, or the pending payment.
  useEffect(() => {
    const workerId = workerData?.workerId;
    if (!workerId || workerData.hourlyRate !== undefined) return;

    let cancelled = false;
    employerService.getWorkerProfile(workerId)
      .then((data) => {
        if (!cancelled && data?.user) {
          setWorkerData(prev => prev ? {
            ...prev,
            hourlyRate: data.user.hourlyRate,
            hourlyRateCurrency: data.user.hourlyRateCurrency ?? null
          } : prev);
        }
      })
      .catch((error) => {
        console.error('Failed to load informational worker rate:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [workerData?.workerId, workerData?.hourlyRate]);

  const total = calculateTotal();

  // ============================================================
  // RENDER
  // ============================================================
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('paymentOptionsPage.loading')}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('paymentOptionsPage.loginRequired')}</h3>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('paymentOptionsPage.loginDescription')}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            {t('paymentOptionsPage.login')}
          </button>
        </div>
      </div>
    );
  }

  if (!workerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        <EmployerSidebar
          language={language}
          sidebarCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          user={authUser}
          handleLogout={handleLogout}
        />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
          <div className="p-4 md:p-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-100 dark:border-gray-700">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t('paymentOptionsPage.noWorkerData')}</h3>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('paymentOptionsPage.goBack')}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t('paymentOptionsPage.goBack')}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <EmployerSidebar
        language={language}
        sidebarCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        mobileMenuOpen={mobileMenuOpen}
        toggleMobileMenu={toggleMobileMenu}
        user={authUser}
        handleLogout={handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'} ml-0`}>
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors lg:hidden"
              >
                <Menu size={20} />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">{t('paymentOptionsPage.title')}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors relative">
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <Globe size={16} />
                {SUPPORTED_LANGUAGES[(SUPPORTED_LANGUAGES.findIndex(item => item.code === language) + 1) % SUPPORTED_LANGUAGES.length].nativeName}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t('paymentOptionsPage.title')}</h1>
              <p className="text-teal-100 mt-1">{t('paymentOptionsPage.subtitle')}</p>
            </div>
          </div>

          {/* Payment Error */}
          {paymentError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {paymentError}
            </div>
          )}

          {/* Payment Message */}
          {paymentMessage && !paymentError && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {paymentMessage}
            </div>
          )}

          {/* Success Message */}
          {paymentSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16} />
              {t('paymentOptionsPage.successRedirecting')}
            </div>
          )}

          {/* Worker Info Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-teal-100 flex items-center justify-center overflow-hidden">
                  {workerData?.profileImage ? (
                    <img 
                      src={workerData.profileImage} 
                      alt={displayWorkerName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-teal-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{displayWorkerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <Briefcase size={14} />
                    <span>{displayJobTitle}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {displayWorkerLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      {workerData?.rating || '4.5'}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-500" />
                      {formatWorkerRate(workerData, t, 'workerProfile.notSpecified')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('paymentOptionsPage.totalAmount')}</p>
                <p className="text-2xl font-bold text-teal-600">EGP {total.toFixed(2)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {pendingPayment?.paymentType === 'quick_hire_premium'
                    ? t('paymentOptionsPage.quickHireFee')
                    : t('paymentOptionsPage.commissionIncluded', { rate: RECRUITMENT_COMMISSION_RATE * 100 })}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('paymentOptionsPage.paymentMethods')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('paymentOptionsPage.chooseMethod')}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <Lock size={16} className="text-green-500" />
                <span>{t('paymentOptionsPage.securePayment')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const isSelected = selectedMethod === method.id;
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => {
                      if (isProcessing) return;
                      setSelectedMethod(method.id);
                      setPaymentError(null);
                      setPaymentMessage('');
                    }}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                      isSelected 
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 ring-2 ring-teal-500 ring-opacity-30'
                        : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:bg-teal-50 dark:bg-teal-900/30'
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isProcessing}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center flex-shrink-0`}>
                        <Icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-800 dark:text-white">{method.name}</p>
                          {method.badge && (
                            <span className={`px-1.5 py-0.5 ${method.badgeColor} text-[10px] font-semibold rounded`}>
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{method.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle size={18} className="text-teal-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handlePayment}
              disabled={isProcessing || !selectedMethod || paymentSuccess}
              className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('paymentOptionsPage.processing')}
                </>
              ) : (
                <>
                  <Shield size={18} />
                  {t('paymentOptionsPage.payNow')}
                </>
              )}
            </button>
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              {t('paymentOptionsPage.back')}
            </button>
          </div>

          {!selectedMethod && !paymentSuccess && !isProcessing && (
            <p className="text-sm text-red-500 mt-3 text-center">{t('paymentOptionsPage.selectMethod')}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
            <Link to="/terms" className="hover:text-red-600 hover:underline transition-colors">
              {t('paymentOptionsPage.terms')}
            </Link>
            <Link to="/refund-policy" className="hover:text-red-600 hover:underline transition-colors">
              {t('paymentOptionsPage.refundPolicy')}
            </Link>
            <Link to="/privacy" className="hover:text-red-600 hover:underline transition-colors">
              {t('paymentOptionsPage.privacyPolicy')}
            </Link>
          </div>

          {/* PayPal Processing Modal */}
          {selectedMethod === PAYMENT_METHODS.PAYPAL && isProcessing && !paymentSuccess && !paymobIframe && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('paymentOptionsPage.paypalTitle')}</h3>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Loader2 size={20} className="animate-spin text-teal-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{paymentMessage || t('paymentOptionsPage.paymentVerifying')}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
                    {paymentMessage === t('paymentOptionsPage.paypalDidNotOpen') ? t('paymentOptionsPage.paypalDidNotOpen') : t('paymentOptionsPage.paypalOpened')}
                  </p>
                </div>
                
                {/* Manual reopen PayPal button */}
                <button
                  onClick={() => {
                    const approvalUrl = localStorage.getItem('homelyserv_paypal_approval_url');
                    if (approvalUrl) {
                      const newWindow = window.open(approvalUrl, '_blank', 'width=800,height=600');
                      if (!newWindow || newWindow.closed) {
                        setPaymentMessage(t('paymentOptionsPage.popupBlocked'));
                      } else {
                        setPaymentMessage(t('paymentOptionsPage.paypalReopened'));
                      }
                    } else {
                      setPaymentError(t('paymentOptionsPage.errors.paypalOrderNotFound'));
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition w-full"
                >
                  {t('paymentOptionsPage.reopenPaypal')}
                </button>
                
                <button
                  onClick={() => {
                    setIsProcessing(false);
                    setPaymentError(t('paymentOptionsPage.cancelledByUser'));
                    setPaymentMessage('');
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                    localStorage.removeItem('homelyserv_paypal_order_id');
                    localStorage.removeItem('homelyserv_paypal_approval_url');
                  }}
                  className="mt-3 text-sm text-red-500 hover:text-red-600 transition block w-full"
                >
                  {t('paymentOptionsPage.cancelPayment')}
                </button>

                {/* Direct link fallback */}
                {paypalApprovalUrl && (
                  <a
                    href={paypalApprovalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-teal-600 hover:text-teal-700 underline block"
                  >
                    {t('paymentOptionsPage.paypalManualLink')}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 text-center flex items-center justify-center gap-2">
              <Lock size={14} />
              {t('paymentOptionsPage.securityNotice')}
            </p>
          </div>

          {/* Paymob Iframe Modal */}
          {paymobIframe && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('paymentOptionsPage.paymobTitle')}</h3>
                  <button
                    onClick={() => {
                      setPaymobIframe(null);
                      setIsProcessing(false);
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
                    title={t('paymentOptionsPage.paymobIframeTitle')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PaymentOptions;
