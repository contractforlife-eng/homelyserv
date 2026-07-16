// src/pages/PaymentCommission.jsx - UPDATED WITH PAYMOB & PAYPAL
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Crown
} from 'lucide-react';
import { markCommissionPaid, verifyPayment } from '../utils/commissionManager';
import { createPaymobPayment, createPayPalOrder } from '../services/paymentService';
import { PAYMENT_METHODS } from '../config/paymentConfig';

const PaymentCommission = () => {
  const navigate = useNavigate();
  const [commissionData, setCommissionData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymobIframe, setPaymobIframe] = useState(null);

  // Payment Methods - ONLY PAYMOB & PAYPAL
  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYMOB,
      name: 'Paymob',
      icon: CreditCard,
      description: 'Pay with credit card, debit card, or mobile wallet',
      color: 'from-blue-500 to-blue-600',
      badge: 'Recommended'
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      icon: Wallet,
      description: 'Pay securely with your PayPal account',
      color: 'from-blue-700 to-blue-800',
      badge: null
    }
  ];

  useEffect(() => {
    const data = localStorage.getItem('homelyserv_commission_payment');
    if (data) {
      setCommissionData(JSON.parse(data));
    } else {
      navigate('/worker/offers');
    }
  }, [navigate]);

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
  const processSuccessfulPayment = (paymentData) => {
    try {
      const result = markCommissionPaid(
        commissionData.offerId,
        commissionData.workerId,
        commissionData.amount,
        paymentData.transactionId || 'TXN-' + Date.now()
      );

      if (result.success) {
        // Save receipt
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
        setPaymentError(result.message || 'Failed to record payment');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentError('An error occurred during payment. Please try again.');
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setPaymentError('Please select a payment method');
      return;
    }

    if (!commissionData) {
      setPaymentError('Payment data not found');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      const orderId = 'COMM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      const customerData = {
        firstName: commissionData.workerName?.split(' ')[0] || 'Worker',
        lastName: commissionData.workerName?.split(' ').slice(1).join(' ') || 'User',
        email: commissionData.workerEmail || 'worker@example.com',
        phone: '+201234567890',
        country: 'EG',
        city: 'Cairo',
        items: [
          {
            name: `Commission for ${commissionData.offerTitle || 'Offer'}`,
            amount: commissionData.amount,
            quantity: 1
          }
        ]
      };

      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        const result = await createPaymobPayment(commissionData.amount, orderId, customerData);
        
        if (result.success) {
          setPaymobIframe(result.iframeUrl);
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || 'Paymob payment failed');
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        const result = await createPayPalOrder(commissionData.amount, orderId, customerData);
        
        if (result.success) {
          window.open(result.approvalUrl, '_blank');
          startPollingPayPalOrder(result.orderId);
        } else {
          throw new Error(result.error || 'PayPal payment failed');
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
    
    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const result = await capturePayPalOrder(orderId);
        
        if (result.success) {
          clearInterval(interval);
          processSuccessfulPayment(result.transaction);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification timed out. Please check your PayPal account.');
          setProcessing(false);
        }
      } catch (error) {
        console.error('PayPal polling error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPaymentError('Payment verification failed. Please try again.');
          setProcessing(false);
        }
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
        amount: data.amount,
        method: method,
        status: 'completed',
        paidAt: new Date().toISOString(),
        company: data.company,
        offerTitle: data.offerTitle
      };

      const receipts = JSON.parse(localStorage.getItem('commission_receipts') || '[]');
      receipts.push(receipt);
      localStorage.setItem('commission_receipts', JSON.stringify(receipts));
      
      console.log('✅ Payment receipt saved:', receipt);
    } catch (error) {
      console.error('Error saving receipt:', error);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      window.removeEventListener('message', handlePaymobMessage);
    };
  }, []);

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
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3">✅ Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Commission of <strong>EGP {commissionData.amount?.toLocaleString()}</strong> paid successfully.
          </p>
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 mb-6 border border-green-200">
            <div className="flex items-center gap-2 justify-center text-green-700">
              <Lock size={18} />
              <span className="font-semibold">Contact information is now unlocked!</span>
            </div>
            <p className="text-sm text-green-600 mt-1">{commissionData.company}</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            <span>Redirecting...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/worker/offers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Offers
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Unlock Contact Information</h1>
            <p className="text-gray-500 mt-2">
              Pay the platform commission to contact {commissionData.company}
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 mb-8 border border-amber-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Commission Amount</p>
                <p className="text-3xl font-bold text-amber-600">EGP {commissionData.amount?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Offer</p>
                <p className="font-medium text-gray-800">{commissionData.offerTitle}</p>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <p className="font-semibold text-gray-700 text-lg">Select Payment Method</p>
            {paymentMethods.map((method) => {
              const isSelected = selectedMethod === method.id;
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => {
                    if (processing) return;
                    setSelectedMethod(method.id);
                    setPaymentError(null);
                  }}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50 shadow-md'
                      : 'border-gray-200 hover:border-amber-200 hover:bg-amber-50/30'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${method.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon size={28} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800 text-lg">{method.name}</p>
                        {method.badge && (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle size={28} className="text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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
                Processing Payment...
              </>
            ) : (
              `Pay EGP ${commissionData.amount?.toLocaleString()} to Unlock`
            )}
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Shield size={16} />
            Secured by HomelyServ
          </div>
        </div>
      </div>

      {/* Paymob Iframe Modal */}
      {paymobIframe && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Pay with Paymob</h3>
              <button
                onClick={() => {
                  setPaymobIframe(null);
                  setProcessing(false);
                  window.removeEventListener('message', handlePaymobMessage);
                }}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
  );
};

export default PaymentCommission;