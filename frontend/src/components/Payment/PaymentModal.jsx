// src/components/Payment/PaymentModal.jsx
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Wallet, Building2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { createPaymobPayment, createPayPalOrder, capturePayPalOrder } from '../../services/paymentService';
import { PAYMENT_METHODS, PAYMENT_STATUS, TRANSACTION_TYPES } from '../../config/paymentConfig';

const PaymentModal = ({ isOpen, onClose, amount, orderId, customerData, transactionType, onSuccess, onError }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymobIframe, setPaymobIframe] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const paymentMethods = [
    {
      id: PAYMENT_METHODS.PAYMOB,
      name: 'Paymob',
      icon: CreditCard,
      description: 'Credit cards, debit cards, and online banking',
      colors: 'from-blue-500 to-blue-600'
    },
    {
      id: PAYMENT_METHODS.PAYPAL,
      name: 'PayPal',
      icon: Wallet,
      description: 'PayPal balance, credit cards, and bank accounts',
      colors: 'from-blue-700 to-blue-800'
    }
  ];

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      if (selectedMethod === PAYMENT_METHODS.PAYMOB) {
        // Paymob Payment
        const result = await createPaymobPayment(amount, orderId, customerData);
        
        if (result.success) {
          // Show Paymob iframe
          setPaymobIframe(result.iframeUrl);
          
          // Listen for payment completion
          window.addEventListener('message', handlePaymobMessage);
        } else {
          throw new Error(result.error || 'Paymob payment failed');
        }
        
      } else if (selectedMethod === PAYMENT_METHODS.PAYPAL) {
        // PayPal Payment
        const result = await createPayPalOrder(amount, orderId, customerData);
        
        if (result.success) {
          // Redirect to PayPal approval page
          window.open(result.approvalUrl, '_blank');
          
          // Start polling for payment completion
          startPollingPayPalOrder(result.orderId);
        } else {
          throw new Error(result.error || 'PayPal payment failed');
        }
      }
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.message);
      setProcessing(false);
      if (onError) onError(error);
    }
  };

  const handlePaymobMessage = (event) => {
    // Handle Paymob iframe response
    if (event.data?.type === 'PAYMENT_COMPLETE') {
      window.removeEventListener('message', handlePaymobMessage);
      setSuccess(true);
      setProcessing(false);
      if (onSuccess) onSuccess(event.data);
      setTimeout(() => {
        onClose();
      }, 3000);
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
          setSuccess(true);
          setProcessing(false);
          if (onSuccess) onSuccess(result.transaction);
          setTimeout(() => {
            onClose();
          }, 3000);
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError('Payment verification timed out. Please check your PayPal account.');
          setProcessing(false);
        }
      } catch (error) {
        console.error('PayPal polling error:', error);
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError('Payment verification failed. Please try again.');
          setProcessing(false);
        }
      }
    }, 3000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('message', handlePaymobMessage);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {success ? 'Payment Successful!' : 'Complete Payment'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={processing && !success}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Payment Summary */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="text-2xl font-bold text-teal-600">EGP {amount.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Order ID</p>
                <p className="text-sm font-mono text-gray-600">{orderId}</p>
              </div>
            </div>
          </div>

          {/* Success State */}
          {success && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Payment Successful!</h3>
              <p className="text-gray-500 mt-2">Your payment has been processed successfully.</p>
            </div>
          )}

          {/* Error State */}
          {error && !success && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* Payment Methods */}
          {!success && (
            <>
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-gray-700">Select Payment Method</p>
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    onClick={() => {
                      if (processing) return;
                      setSelectedMethod(method.id);
                      setError(null);
                    }}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-teal-200'
                    } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${method.colors} flex items-center justify-center`}>
                        <method.icon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle size={24} className="text-teal-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handlePayment}
                disabled={processing || !selectedMethod}
                className={`w-full py-3 rounded-xl text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
                  processing || !selectedMethod
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay EGP {amount.toFixed(2)}</>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield size={16} />
                Secured by HomelyServ
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;