// src/pages/PaymentCommission.jsx - الحل الجذري
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
  Loader2
} from 'lucide-react';
import { markCommissionPaid, verifyPayment } from '../utils/commissionManager';

const PaymentCommission = () => {
  const navigate = useNavigate();
  const [commissionData, setCommissionData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: CreditCard, description: 'Visa, Mastercard' },
    { id: 'wallet', name: 'Mobile Wallet', icon: Smartphone, description: 'Vodafone Cash, Orange Money' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building, description: 'Direct bank transfer' }
  ];

  useEffect(() => {
    const data = localStorage.getItem('homelyserv_commission_payment');
    if (data) {
      setCommissionData(JSON.parse(data));
    } else {
      navigate('/worker/offers');
    }
  }, [navigate]);

  // ============================================================
  // ✅ معالجة الدفع - لا تظهر رسالة نجاح إلا بعد التسجيل الفعلي
  // ============================================================
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
      console.log('🔄 Processing payment for offer:', commissionData.offerId);
      
      // ✅ 1. التحقق من عدم وجود دفع مسبق
      const existingPayment = verifyPayment(commissionData.offerId, commissionData.workerId);
      if (existingPayment.verified) {
        setPaymentError('⚠️ Payment already processed for this offer');
        setProcessing(false);
        return;
      }

      // ✅ 2. محاكاة معالجة الدفع
      const paymentResult = await processPaymentWithGateway(commissionData, selectedMethod);
      
      if (!paymentResult.success) {
        setPaymentError(paymentResult.error || 'Payment failed. Please try again.');
        setProcessing(false);
        return;
      }

      // ✅ 3. ✅✅✅ التسجيل الفعلي في localStorage (الخطوة الأهم)
      const result = markCommissionPaid(
        commissionData.offerId,
        commissionData.workerId,
        commissionData.amount,
        paymentResult.transactionId
      );

      if (!result.success) {
        setPaymentError(result.message || 'Failed to record payment');
        setProcessing(false);
        return;
      }

      // ✅ 4. حفظ إيصال الدفع
      savePaymentReceipt(commissionData, selectedMethod, paymentResult.transactionId);
      
      // ✅ 5. تنظيف البيانات المؤقتة
      localStorage.removeItem('homelyserv_commission_payment');
      
      // ✅ 6. ✅✅✅ التحقق من أن الدفع سجل فعلاً قبل التوجيه
      const verification = verifyPayment(commissionData.offerId, commissionData.workerId);
      if (verification.verified) {
        console.log('✅ Payment verified in localStorage:', verification.payment);
        
        // ✅ 7. التوجيه مباشرة إلى صفحة العروض مع رسالة نجاح
        setPaymentSuccess(true);
        setProcessing(false);
        
        setTimeout(() => {
          navigate('/worker/offers', {
            state: {
              commissionSuccess: true,
              offerId: commissionData.offerId,
              transactionId: paymentResult.transactionId,
              message: '✅ Commission paid successfully! Contact information is now unlocked.'
            }
          });
        }, 1500);
      } else {
        setPaymentError('Payment verification failed. Please contact support.');
        setProcessing(false);
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('An error occurred during payment. Please try again.');
      setProcessing(false);
    }
  };

  // ============================================================
  // ✅ محاكاة بوابة الدفع
  // ============================================================
  const processPaymentWithGateway = (data, method) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // التحقق من صحة البيانات
        if (!data.amount || data.amount <= 0) {
          resolve({ 
            success: false, 
            error: 'Invalid payment amount'
          });
          return;
        }

        if (!data.offerId || !data.workerId) {
          resolve({ 
            success: false, 
            error: 'Missing payment information'
          });
          return;
        }

        // ✅ محاكاة نجاح الدفع (90%)
        const isSuccessful = Math.random() > 0.1;
        
        if (isSuccessful) {
          const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
          
          resolve({ 
            success: true, 
            transactionId: transactionId,
            amount: data.amount,
            method: method
          });
        } else {
          resolve({ 
            success: false, 
            error: 'Payment declined. Please try again.'
          });
        }
      }, 2000);
    });
  };

  // ============================================================
  // ✅ حفظ إيصال الدفع
  // ============================================================
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

  if (!commissionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">✅ Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            Commission of <strong>EGP {commissionData.amount?.toLocaleString()}</strong> paid successfully.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-sm text-green-700">
            Contact information is now unlocked for {commissionData.company}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Redirecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/worker/offers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Offers
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Unlock Contact Information</h1>
            <p className="text-gray-500 mt-2">
              Pay the platform commission to contact {commissionData.company}
            </p>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Commission Amount</p>
                <p className="text-2xl font-bold text-yellow-600">EGP {commissionData.amount?.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Offer</p>
                <p className="font-medium text-gray-800">{commissionData.offerTitle}</p>
              </div>
            </div>
          </div>

          {paymentError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {paymentError}
            </div>
          )}

          <div className="space-y-3 mb-8">
            <p className="font-medium text-gray-700">Select Payment Method</p>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => {
                  if (processing) return;
                  setSelectedMethod(method.id);
                  setPaymentError(null);
                }}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-200'
                } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedMethod === method.id
                      ? 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <method.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{method.name}</p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle size={24} className="text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={processing || !selectedMethod}
            className={`w-full py-3 rounded-xl text-white font-semibold text-lg transition-all ${
              processing || !selectedMethod
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 hover:bg-yellow-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {processing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" />
                Processing Payment...
              </div>
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
    </div>
  );
};

export default PaymentCommission;