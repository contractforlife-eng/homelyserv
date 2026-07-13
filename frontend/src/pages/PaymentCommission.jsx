// src/pages/PaymentCommission.jsx - النسخة الكاملة
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
  AlertCircle
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
  // ✅ معالجة الدفع الفعلية مع التحقق
  // ============================================================
  const handlePayment = async () => {
    if (!selectedMethod || !commissionData) {
      setPaymentError('Please select a payment method');
      return;
    }

    setProcessing(true);
    setPaymentError(null);

    try {
      const paymentResult = await processPaymentWithGateway(commissionData, selectedMethod);
      
      if (paymentResult.success) {
        const result = markCommissionPaid(
          commissionData.offerId,
          commissionData.workerId,
          commissionData.amount,
          paymentResult.transactionId
        );

        if (result.success) {
          setPaymentSuccess(true);
          
          localStorage.removeItem('homelyserv_commission_payment');
          savePaymentReceipt(commissionData, selectedMethod, paymentResult.transactionId);
          
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
          setPaymentError(result.message || 'Payment recording failed.');
        }
      } else {
        setPaymentError(paymentResult.error || 'Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentError('An error occurred during payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ============================================================
  // ✅ محاكاة بوابة الدفع مع تحقق إضافي
  // ============================================================
  const processPaymentWithGateway = (data, method) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!data.amount || data.amount <= 0) {
          resolve({ 
            success: false, 
            error: 'Invalid payment amount',
            code: 'INVALID_AMOUNT'
          });
          return;
        }

        if (!data.offerId || !data.workerId) {
          resolve({ 
            success: false, 
            error: 'Missing payment information',
            code: 'MISSING_INFO'
          });
          return;
        }

        // التحقق من عدم وجود دفع مسبق
        const verification = verifyPayment(data.offerId, data.workerId);
        if (verification.verified) {
          resolve({ 
            success: false, 
            error: 'Payment already processed for this offer',
            code: 'DUPLICATE'
          });
          return;
        }

        // محاكاة معالجة الدفع (90% نجاح)
        const isSuccessful = Math.random() > 0.1;
        
        if (isSuccessful) {
          const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8);
          
          resolve({ 
            success: true, 
            transactionId: transactionId,
            amount: data.amount,
            method: method,
            timestamp: new Date().toISOString(),
            code: 'SUCCESS'
          });
        } else {
          resolve({ 
            success: false, 
            error: 'Payment declined by payment provider. Please try again.',
            code: 'DECLINED'
          });
        }
      }, 2000);
    });
  };

  // ============================================================
  // ✅ حفظ إيصال الدفع مع رقم المعاملة
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
        offerTitle: data.offerTitle,
        verified: true
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! ✅</h2>
          <p className="text-gray-600 mb-4">
            You have successfully paid the commission of <strong>EGP {commissionData.amount?.toLocaleString()}</strong>.
            Contact information is now unlocked.
          </p>
          <div className="bg-green-50 rounded-lg p-4 mb-6 text-sm text-green-700">
            You can now contact {commissionData.company} directly.
          </div>
          <button
            onClick={() => navigate('/worker/offers', { 
              state: { 
                commissionSuccess: true, 
                offerId: commissionData.offerId 
              } 
            })}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go to Offers
          </button>
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
                  setSelectedMethod(method.id);
                  setPaymentError(null);
                }}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                  selectedMethod === method.id
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-200'
                }`}
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
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-400 text-center">
            By clicking "Pay", you agree to the platform commission terms.
            <br />
            This is a secure payment processed by HomelyServ.
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCommission;