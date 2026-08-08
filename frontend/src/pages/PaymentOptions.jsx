// src/pages/PaymentOptions.jsx - COMPLETE WITH PAYMOB & PAYPAL INTEGRATION - FIXED
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { isUserPremium, applyBackendSubscription } from '../utils/subscriptionService';
import EmployerSidebar from '../components/employer/EmployerSidebar';
import PaymentOptionsPage from './PaymentOptions';
import { createPaymobPayment, createPayPalOrder, capturePayPalOrder, completePayment, fetchSubscriptionStatus } from '../services/paymentService';
import { PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../config/paymentConfig';
import { RECRUITMENT_COMMISSION_RATE } from '../config/monetization';
import hireService from '../services/hireService';
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
  const navigate = useNavigate();
  const location = useLocation();
  const [language, setLanguage] = useState('en');
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
      description: 'Pay with credit card, debit card, or online banking',
      color: 'teal',
      badge: 'Recommended',
      badgeColor: 'bg-green-100 text-green-700'
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      icon: Wallet,
      description: 'Pay securely with your PayPal account',
      color: 'blue',
      badge: null,
      badgeColor: null
    }
  ];

  const translations = {
    en: {
      title: 'Payment Options',
      subtitle: 'Choose your preferred payment method',
      selectedWorker: 'Selected Worker',
      totalAmount: 'Total Amount',
      commission: `Commission (${RECRUITMENT_COMMISSION_RATE * 100}%) included`,
      paymentMethods: 'Payment Methods',
      selectMethod: 'Select a payment method',
      confirmPayment: 'Confirm Payment',
      processing: 'Processing...',
      success: 'Payment Successful!',
      successMessage: 'You have successfully hired this worker. An offer has been created for them.',
      back: 'Back',
      languageToggle: 'العربية',
      loading: 'Loading payment options...',
      noWorkerData: 'No worker selected',
      goBack: 'Go back and select a worker',
      securePayment: 'Secure Payment',
      chooseMethod: 'Choose your payment method below',
      jobTitle: 'Job Title',
      employer: 'Employer',
      worker: 'Worker',
      hireSuccess: '✅ Successfully hired {worker}!',
      viewHires: 'View My Hires',
      paymobTitle: 'Pay with Paymob',
      paypalTitle: 'Pay with PayPal',
      redirecting: 'Redirecting to PayPal...',
      paymentFailed: 'Payment failed. Please try again.',
      paymentCancelled: 'Payment cancelled.',
      paymentVerifying: 'Verifying payment...',
      payNow: 'Pay Now',
      reference: 'Reference',
      orderId: 'Order ID',
      amount: 'Amount',
      currency: 'EGP',
      paypalOpened: '🔄 PayPal window opened. Complete the payment there.',
      checkingPayment: 'Checking payment status...',
      waitingApproval: '⏳ Waiting for you to approve the payment in PayPal...',
      paymentApproved: '✅ Payment approved! Finalizing...',
      reopenPaypal: 'Reopen PayPal Window',
      paypalDidNotOpen: '⚠️ PayPal window didn\'t open automatically. Click below to open it manually.',
      completingPayment: 'Completing your payment...'
    },
    ar: {
      title: 'خيارات الدفع',
      subtitle: 'اختر طريقة الدفع المفضلة لديك',
      selectedWorker: 'العامل المختار',
      totalAmount: 'المبلغ الإجمالي',
      commission: `العمولة (${RECRUITMENT_COMMISSION_RATE * 100}%) مشمولة`,
      paymentMethods: 'طرق الدفع',
      selectMethod: 'اختر طريقة الدفع',
      confirmPayment: 'تأكيد الدفع',
      processing: 'جاري المعالجة...',
      success: 'تم الدفع بنجاح!',
      successMessage: 'لقد قمت بتوظيف هذا العامل بنجاح. تم إنشاء عرض عمل له.',
      back: 'رجوع',
      languageToggle: 'English',
      loading: 'جاري تحميل خيارات الدفع...',
      noWorkerData: 'لم يتم اختيار عامل',
      goBack: 'ارجع واختر عاملاً',
      securePayment: 'دفع آمن',
      chooseMethod: 'اختر طريقة الدفع أدناه',
      jobTitle: 'المسمى الوظيفي',
      employer: 'صاحب العمل',
      worker: 'العامل',
      hireSuccess: '✅ تم توظيف {worker} بنجاح!',
      viewHires: 'عرض توظيفاتي',
      paymobTitle: 'الدفع عبر Paymob',
      paypalTitle: 'الدفع عبر PayPal',
      redirecting: 'جاري التوجيه إلى PayPal...',
      paymentFailed: 'فشل الدفع. يرجى المحاولة مرة أخرى.',
      paymentCancelled: 'تم إلغاء الدفع.',
      paymentVerifying: 'جاري التحقق من الدفع...',
      payNow: 'ادفع الآن',
      reference: 'المرجع',
      orderId: 'رقم الطلب',
      amount: 'المبلغ',
      currency: 'EGP',
      paypalOpened: '🔄 تم فتح نافذة PayPal. أكمل الدفع هناك.',
      checkingPayment: 'جاري التحقق من حالة الدفع...',
      waitingApproval: '⏳ في انتظار موافقتك على الدفع في PayPal...',
      paymentApproved: '✅ تم الموافقة على الدفع! جاري الإنهاء...',
      reopenPaypal: 'إعادة فتح نافذة PayPal',
      paypalDidNotOpen: '⚠️ لم تفتح نافذة PayPal تلقائياً. انقر أدناه لفتحها يدوياً.',
      completingPayment: 'جاري إكمال دفعتك...'
    }
  };

  const t = translations[language] || translations.en;

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
  // UPDATE OFFER STATUS
  // ============================================================
  const updateOfferStatus = async (offerId, status, hireId) => {
    try {
      if (!offerId) return;
      await hireService.updateOfferStatus(offerId, status);
    } catch (error) {
      console.error('Error updating offer status:', error);
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

      // Notify backend to update Hire & Offer payment status
      try {
        await completePayment(paymentData?.orderId || paymentData?.paymentId || paymentData?.transactionId, authUser?.id);
      } catch (err) {
        console.warn('Backend complete-payment call failed:', err);
      }
      
      if (pendingPayment?.offerId) {
        updateOfferStatus(pendingPayment.offerId, 'hired', hireId);
      }

      // Create payment record
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

    createdAt: new Date().toISOString(),

    contactRevealed: true,
    paymentVerified: true,

    fullSalary: pendingPayment?.fullSalary || workerData?.salary || total,
    commission: total
      };

      // Save to all_payments
      const allPayments = JSON.parse(localStorage.getItem('all_payments') || '[]');
      allPayments.push(paymentRecord);
      localStorage.setItem('all_payments', JSON.stringify(allPayments));

      // Save to employer_payments
      const employerPayments = JSON.parse(localStorage.getItem('employer_payments') || '[]');
      employerPayments.push(paymentRecord);
      localStorage.setItem('employer_payments', JSON.stringify(employerPayments));

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
      setPaymentError('Failed to process payment. Please contact support.');
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
      setPaymentError(t.paymentCancelled || 'Payment cancelled.');
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
    setPaymentMessage('✅ Payment completed! Finalizing...');
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
    setPaymentMessage(t.waitingApproval);
    
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
          setPaymentMessage('✅ Payment captured successfully!');
          processSuccessfulPayment(result.transaction);
          return;
        }
        
        // Check if order is approved but not yet captured
        if (result.status === 'APPROVED') {
          console.log('⏳ Order approved, attempting to capture...');
          setPaymentMessage(t.paymentApproved);
          // Continue polling - next attempt will try to capture again
          return;
        }
        
        // Check if order is still pending approval
        if (result.status === 'PENDING_APPROVAL' || result.status === 'CREATED') {
          console.log('⏳ Waiting for user approval...');
          setPaymentMessage(t.waitingApproval);
          // Continue polling
          return;
        }
        
        // Check for ORDER_NOT_APPROVED error
        if (result.error && (result.error.includes('ORDER_NOT_APPROVED') || result.error.includes('not approved'))) {
          console.log('⏳ Order not approved yet, waiting...');
          setPaymentMessage(t.waitingApproval);
          // Continue polling - this is expected until user approves
          return;
        }
        
        // Check if we've reached max attempts
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingInterval(null);
          setPaymentError('Payment verification timed out. Please check your PayPal account.');
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
          setPaymentError('Payment verification failed. Please try again.');
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
      setPaymentError('Please select a payment method');
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);
    setPaymentMessage('');

    try {
      const total = calculateTotal();
      
      if (total <= 0 || Number.isNaN(total)) {
        throw new Error('Invalid payment amount. Please try again.');
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
          throw new Error(result.error || 'Paymob payment failed');
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
            setPaymentMessage(t.paypalDidNotOpen);
            // Still start polling and show the reopen button
            startPollingPayPalOrder(result.paypalOrderId || result.orderId);
          } else {
            setPaymentMessage(t.paypalOpened);
            // Start polling for payment completion
            startPollingPayPalOrder(result.paypalOrderId || result.orderId);
          }
        } else {
          throw new Error(result.error || 'PayPal payment failed');
        }
      }
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // ============================================================
  // UI HELPERS
  // ============================================================
  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
    localStorage.setItem('homelyserv_language', newLang);
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
    const savedLang = localStorage.getItem('homelyserv_language');
    if (savedLang) setLanguage(savedLang);
    
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

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const total = calculateTotal();

  // ============================================================
  // RENDER
  // ============================================================
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Please Log In</h3>
          <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">You need to be logged in to make a payment.</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
          >
            Log In
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
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{t.noWorkerData}</h3>
              <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.goBack}</p>
              <button
                onClick={() => navigate('/employer-search')}
                className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
              >
                {t.goBack}
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
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white hidden sm:block">{t.title}</h2>
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
                {t.languageToggle}
              </button>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 mb-6 text-white">
            <div>
              <h1 className="text-2xl font-bold">{t.title}</h1>
              <p className="text-teal-100 mt-1">{t.subtitle}</p>
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
              {t.success} Redirecting...
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
                      alt={workerData?.workerName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={28} className="text-teal-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{workerData?.workerName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <Briefcase size={14} />
                    <span>{workerData?.desiredJob || 'Service Provider'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {workerData?.workerLocation || 'Location not specified'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500" />
                      {workerData?.rating || '4.5'}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign size={14} className="text-green-500" />
                      {workerData?.hourlyRate || 30} EGP/hr
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.totalAmount}</p>
                <p className="text-2xl font-bold text-teal-600">EGP {total.toFixed(2)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {pendingPayment?.paymentType === 'quick_hire_premium'
                    ? 'Quick Hire premium service fee'
                    : `${RECRUITMENT_COMMISSION_RATE * 100}% recruitment commission included`}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.paymentMethods}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t.chooseMethod}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <Lock size={16} className="text-green-500" />
                <span>{t.securePayment}</span>
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
                  {t.processing}
                </>
              ) : (
                <>
                  <Shield size={18} />
                  {t.payNow}
                </>
              )}
            </button>
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-900 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              {t.back}
            </button>
          </div>

          {!selectedMethod && !paymentSuccess && !isProcessing && (
            <p className="text-sm text-red-500 mt-3 text-center">{t.selectMethod}</p>
          )}

          {/* PayPal Processing Modal */}
          {selectedMethod === PAYMENT_METHODS.PAYPAL && isProcessing && !paymentSuccess && !paymobIframe && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet size={32} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.paypalTitle}</h3>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Loader2 size={20} className="animate-spin text-teal-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{paymentMessage || t.paymentVerifying}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
                    {paymentMessage === t.paypalDidNotOpen ? t.paypalDidNotOpen : t.paypalOpened}
                  </p>
                </div>
                
                {/* Manual reopen PayPal button */}
                <button
                  onClick={() => {
                    const approvalUrl = localStorage.getItem('homelyserv_paypal_approval_url');
                    if (approvalUrl) {
                      const newWindow = window.open(approvalUrl, '_blank', 'width=800,height=600');
                      if (!newWindow || newWindow.closed) {
                        setPaymentMessage('⚠️ Popup blocked. Please allow popups or click the link below.');
                      } else {
                        setPaymentMessage('🔄 PayPal window reopened. Please complete the payment.');
                      }
                    } else {
                      setPaymentError('Could not find PayPal order. Please try again.');
                    }
                  }}
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition w-full"
                >
                  {t.reopenPaypal}
                </button>
                
                <button
                  onClick={() => {
                    setIsProcessing(false);
                    setPaymentError('Payment cancelled by user.');
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
                  Cancel Payment
                </button>

                {/* Direct link fallback */}
                {paypalApprovalUrl && (
                  <a
                    href={paypalApprovalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-sm text-teal-600 hover:text-teal-700 underline block"
                  >
                    Click here if PayPal doesn't open
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Info Message */}
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100">
            <p className="text-xs text-blue-600 text-center flex items-center justify-center gap-2">
              <Lock size={14} />
              Your payment will be processed securely through Paymob or PayPal. 
              The worker will be hired immediately after payment confirmation.
            </p>
          </div>

          {/* Paymob Iframe Modal */}
          {paymobIframe && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t.paymobTitle}</h3>
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
                    title="Paymob Payment"
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