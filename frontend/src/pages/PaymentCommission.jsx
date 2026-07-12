// src/pages/PaymentCommission.jsx
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
  Smartphone
} from 'lucide-react';
import { markCommissionPaid } from '../utils/commissionManager';

const PaymentCommission = () => {
  const navigate = useNavigate();
  const [commissionData, setCommissionData] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit Card', icon: CreditCard },
    { id: 'wallet', name: 'Mobile Wallet', icon: Smartphone },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: Building }
  ];

  useEffect(() => {
    const data = localStorage.getItem('homelyserv_commission_payment');
    if (data) {
      setCommissionData(JSON.parse(data));
    } else {
      navigate('/worker/offers');
    }
  }, [navigate]);

  const handlePayment = () => {
    if (!selectedMethod || !commissionData) return;

    setProcessing(true);

    setTimeout(() => {
      // تسجيل دفع العمولة
      const success = markCommissionPaid(
        commissionData.offerId,
        commissionData.workerId,
        commissionData.amount
      );

      if (success) {
        // تنظيف البيانات المؤقتة
        localStorage.removeItem('homelyserv_commission_payment');
        
        // التوجيه إلى صفحة العروض مع رسالة نجاح
        navigate('/worker/offers', {
          state: {
            commissionSuccess: true,
            offerId: commissionData.offerId
          }
        });
      } else {
        alert('Payment failed. Please try again.');
        setProcessing(false);
      }
    }, 2000);
  };

  if (!commissionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
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

          <div className="space-y-3 mb-8">
            <p className="font-medium text-gray-700">Select Payment Method</p>
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
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
                Processing...
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