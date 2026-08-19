// src/pages/PaymentCommission.jsx - FIXED: Only commission is charged
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardHeader from '../components/layout/DashboardHeader';
import {
  Lock,
  Shield,
  CheckCircle,
  ArrowLeft,
  CreditCard,
  Wallet,
  Building,
  Smartphone,
  AlertCircle,
  Loader2,
  Crown,
  Info,
  X,
  Building2
} from 'lucide-react';
import { markCommissionPaid, verifyPayment } from '../utils/commissionManager';
import { RECRUITMENT_COMMISSION_RATE } from '../config/monetization';
import { createPaymobPayment, createPayPalOrder, capturePayPalOrder, getPaymentStatus } from '../services/paymentService';
import { PAYMENT_METHODS, PAYMOB_ENABLED } from '../config/paymentConfig';
import ManualPaymentFlow from '../components/Payment/ManualPaymentFlow';
import useAuthStore from '../store/authStore';

const PaymentCommission = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [commissionData, setCommissionData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymobIframe, setPaymobIframe] = useState(null);
  const paypalPollingRef = useRef(null);
  const paypalCaptureRequestedRef = useRef(false);
  const [manualPaymentSubmitted, setManualPaymentSubmitted] = useState(false);

  // Get authenticated user from authStore
  const authUser = useAuthStore(state => state.user);
  const authLoading = useAuthStore(state => state.loading);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Payment Methods - PAYMOB disabled, PAYPAL + MANUAL
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      icon: Wallet,
      description: t('paymentCommission.methods.paypalDescription'),
      color: 'from-blue-700 to-blue-800',
      badge: null
    },
    {
      id: PAYMENT_METHODS.VODAFONE_CASH,
      name: t('manualPayment.vodafoneCash'),
      icon: Smartphone,
      description: t('manualPayment.egyptOnly') + ' - ' + t('manualPayment.pendingWarning'),
      color: 'from-red-500 to-red-600',
      badge: t('manualPayment.manualVerification')
    },
    {
      id: PAYMENT_METHODS.INSTAPAY,
      name: t('manualPayment.instapay'),
      icon: Building2,
      description: t('manualPayment.egyptOnly') + ' - ' + t('manualPayment.pendingWarning'),
      color: 'from-blue-500 to-blue-600',
      badge: t('manualPayment.manualVerification')
    }
  ];

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated || !authUser) {
      navigate('/login');
      return;
    }

    const data = localStorage.getItem('homelyserv_commission_payment');
    if (data) {
      setCommissionData(JSON.parse(data));
    } else {
      navigate('/worker/offers');
    }
  }, [navigate, isAuthenticated, authUser]);

  // Handle Paymob iframe message
  const handlePaymobMessage = (event) => {
    if (event.data?.type === 'PAYMENT_COMPLETE') {
      setPaymentSuccess(true);
      setProcessing(false);
      setPaymobIframe(null);
      window.removeEventListener('message', handlePaymobMessage);
      
      // Process successful payment
      processSuccessfulPayment(event.data);
    }
  };

  // Process successful payment
  const processSuccessfulPayment = async (paymentData) => {
    try {
      console.log("Commission Data:", commissionData);
      
      // Record payment in localStorage (existing behavior)
      const result = markCommissionPaid(
        commissionData.offerId,
        commissionData.workerId,
        commissionData.commissionAmount, // ← Only the commission amount
        paymentData.transactionId || 'TXN-' + Date.now()
      );

      if (result.success) {
        // Persist payment to MongoDB via Prisma (new behavior)
        try {
          const api = (await import('../utils/api')).default;
          
          await api.post('/api/commission/record', {
            offerId: commissionData.offerId,
            workerId: commissionData.workerId,
            employerId: authUser?.id, // Authenticated employer
            hireId: commissionData.hireId || null,
            commissionAmount: commissionData.commissionAmount,
            paymentMethod: selectedMethod,
            transactionId: paymentData.transactionId || 'TXN-' + Date.now(),
            fullSalary: commissionData.fullSalary
          });
          
          console.log('✅ Commission payment persisted to MongoDB');
        } catch (backendError) {
          console.error('⚠️ Failed to persist payment to MongoDB:', backendError);
          // Don't block the UI if backend persistence fails
          // The localStorage record still exists for verification
        }

        savePaymentReceipt(commissionData, selectedMethod, paymentData.transactionId);
        localStorage.removeItem('homelyserv_commission_payment');
        
        setTimeout(() => {
          navigate('/worker/offers', {
            state: {
              commissionSuccess: true,
              offerId: commissionData.offerId,
              transactionId: paymentData.transactionId,
              message: '✅ Commission paid successfully! Contact information is now unlocked.'
            }
          });
        }, 1500);
      } else {
        setPaymentError(result.message || t('paymentCommission.errors.recordFailed'));
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentError(t('paymentCommission.errors.processingFailed'));
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setPaymentError(t('paymentCommission.errors.selectMethod'));
      return;
    }

    if (!commissionData) {
      setPaymentError(t('paymentCommission.errors.dataNotFound'));
      return;
    }

    if (selectedMethod === PAYMENT_METHODS.VODAFONE_CASH || selectedMethod === PAYMENT_METHODS.INSTAPAY) {
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated || !authUser) {
      setPaymentError(t('paymentCommission.errors.loginRequired'));
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      const orderId = 'COMM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const customerData = {
        firstName: authUser?.fullName?.split(' ')[0] || commissionData.workerName?.split(' ')[0] || 'Worker',
        lastName: authUser?.fullName?.split(' ').slice(1).join(' ') || commissionData.workerName?.split(' ').slice(1).join(' ') || 'User',
        email: authUser?.email || commissionData.workerEmail || 'worker@example.com',
        phone: authUser?.phone || '+201234567890',
        country: 'EG',
        city: 'Cairo',
        userId: authUser?.id,
        items: [
          {
            name: `Commission for ${commissionData.offerTitle || 'Offer'}`,
            amount: commissionData.commissionAmount,
            quantity: 1
          }
        ]
      };

      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        const result = await createPaymobPayment(commissionData.commissionAmount, orderId, customerData);
        
        if (result.success) {
          setPaymobIframe(result.iframeUrl);
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || t('paymentCommission.errors.paymobFailed'));
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        paypalCaptureRequestedRef.current = false;
        const result = await createPayPalOrder(commissionData.commissionAmount, orderId, customerData);
        
        if (result.success) {
          window.open(result.approvalUrl, '_blank');
          startPollingPayPalOrder(result.orderId);
        } else {
          throw new Error(result.error || t('paymentCommission.errors.paypalFailed'));
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError(error.message);
      setProcessing(false);
    }
  };

  const startPollingPayPalOrder = (orderId) => {
    let attempts = 0;
    const maxAttempts = 30;

    if (paypalPollingRef.current) clearInterval(paypalPollingRef.current);
    paypalPollingRef.current = setInterval(async () => {
      attempts++;
      
      try {
        const statusResult = await getPaymentStatus(orderId);
        const providerState = statusResult?.payment?.providerState;
        if (providerState === 'TERMINAL') {
          clearInterval(paypalPollingRef.current);
          paypalPollingRef.current = null;
          setPaymentError(t('paymentCommission.errors.verificationFailed'));
          setProcessing(false);
          return;
        }
        if (!['APPROVED', 'COMPLETED'].includes(providerState)) {
          if (attempts >= maxAttempts) {
            clearInterval(paypalPollingRef.current);
            paypalPollingRef.current = null;
            setPaymentError(t('paymentCommission.errors.verificationTimeout'));
            setProcessing(false);
          }
          return;
        }

        clearInterval(paypalPollingRef.current);
        paypalPollingRef.current = null;
        if (paypalCaptureRequestedRef.current) return;
        paypalCaptureRequestedRef.current = true;
        const result = await capturePayPalOrder(orderId);
        
        if (result.success) {
          processSuccessfulPayment(result.transaction);
        } else {
          setPaymentError(t('paymentCommission.errors.verificationFailed'));
          setProcessing(false);
        }
      } catch (error) {
        console.error('PayPal polling error:', error);
        if (paypalPollingRef.current) clearInterval(paypalPollingRef.current);
        paypalPollingRef.current = null;
        setPaymentError(t('paymentCommission.errors.verificationFailed'));
        setProcessing(false);
      }
    }, 3000);
  };

  const savePaymentReceipt = (data, method, transactionId) => {
    try {
      const receipt = {
        id: 'REC-' + Date.now(),
        transactionId: transactionId,
        offerId: data.offerId,
        workerId: data.workerId,
        workerName: data.workerName,
        amount: data.commissionAmount, // ← Only commission
        fullSalary: data.fullSalary, // ← Stored as info only
        method: method,
        status: 'completed',
        paidAt: new Date().toISOString(),
        company: data.company,
        offerTitle: data.offerTitle,
        userId: authUser?.id
      };

      const receipts = JSON.parse(localStorage.getItem('commission_receipts') || '[]');
      receipts.push(receipt);
      localStorage.setItem('commission_receipts', JSON.stringify(receipts));
      
      console.log('✅ Payment receipt saved:', receipt);
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };

  const handleManualProofSubmitted = () => {
    setManualPaymentSubmitted(true);
    setProcessing(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (paypalPollingRef.current) {
        clearInterval(paypalPollingRef.current);
        paypalPollingRef.current = null;
      }
      window.removeEventListener('message', handlePaymobMessage);
    };
  }, []);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!commissionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-3">{t('paymentCommission.success.title')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {t('paymentCommission.success.commissionPrefix')} <strong>EGP {commissionData.commissionAmount?.toLocaleString()}</strong> {t('paymentCommission.success.commissionSuffix')}
          </p>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-200">
            <div className="flex items-center gap-2 justify-center text-green-700">
              <Lock size={18} />
              <span className="font-semibold">{t('paymentCommission.success.contactUnlocked')}</span>
            </div>
            <p className="text-sm text-green-600 mt-1">{commissionData.company}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            <span>{t('paymentCommission.success.redirecting')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="WORKER">
      <DashboardHeader
        title={t('paymentCommission.title')}
        notificationUserId={authUser?.id || authUser?.email}
      />
      <div className="p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/worker/offers')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('paymentCommission.backToOffers')}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t('paymentCommission.unlockTitle')}</h1>
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
              {t('paymentCommission.unlockDescription', { company: commissionData.company })}
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 mb-8 border border-amber-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('paymentCommission.platformCommission')}</p>
                <p className="text-3xl font-bold text-amber-600">EGP {commissionData.commissionAmount?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{t('paymentCommission.workerSalaryInfo')}</p>
                <p className="font-medium text-gray-800 dark:text-white">EGP {commissionData.fullSalary?.toLocaleString()}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('paymentCommission.salaryDirect')}</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700 font-medium">{t('paymentCommission.howItWorks')}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {t('paymentCommission.explanationPrefix')} <strong>{t('paymentCommission.platformCommissionLower')}</strong> ({RECRUITMENT_COMMISSION_RATE * 100}% {t('paymentCommission.salaryPercentageSuffix')}).
                  {t('paymentCommission.explanationSalary')}
                </p>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-2xl text-red-600 flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">{t('paymentCommission.selectMethod')}</p>
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.id;
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => {
                    if (processing || manualPaymentSubmitted) return;
                    setSelectedMethod(method.id);
                    setPaymentError(null);
                  }}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-amber-200 hover:bg-amber-50/30'
                  } ${processing || manualPaymentSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 dark:text-white text-lg">{method.name}</p>
                        {method.badge && (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{method.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle size={28} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedMethod === PAYMENT_METHODS.VODAFONE_CASH || selectedMethod === PAYMENT_METHODS.INSTAPAY ? (
            <ManualPaymentFlow
              paymentMethod={selectedMethod}
              purpose="COMMISSION"
              hireId={commissionData.hireId}
              onSubmitted={handleManualProofSubmitted}
              onCancel={() => setSelectedMethod(null)}
            />
          ) : (
            <button
              onClick={handlePayment}
              disabled={processing || !selectedMethod}
              className={`w-full py-4 rounded-2xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                processing || !selectedMethod
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-xl hover:scale-[1.02] transform transition-all'
              }`}
            >
              {processing ? (
                <>
                  <Loader2 size={22} className="animate-spin" />
                  {t('paymentCommission.processing')}
                </>
              ) : (
                t('paymentCommission.payToUnlock', { amount: commissionData.commissionAmount?.toLocaleString() })
              )}
            </button>
          )}

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <Shield size={16} />
            {t('paymentCommission.securedBy')}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-400 dark:text-gray-500">
            <Link to="/terms" className="hover:text-red-600 hover:underline transition-colors">
              {t('paymentCommission.terms')}
            </Link>
            <Link to="/refund-policy" className="hover:text-red-600 hover:underline transition-colors">
              {t('paymentCommission.refundPolicy')}
            </Link>
            <Link to="/privacy" className="hover:text-red-600 hover:underline transition-colors">
              {t('paymentCommission.privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>

      {/* Paymob Iframe Modal */}
      {paymobIframe && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('paymentCommission.payWithPaymob')}</h3>
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
                title={t('paymentCommission.paymobIframeTitle')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  </DashboardLayout>
  );
};

export default PaymentCommission;
