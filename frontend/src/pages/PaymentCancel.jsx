// src/pages/PaymentCancel.jsx
// PayPal cancel callback page - shown when user cancels payment in PayPal.
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import useAuthStore from '../store/authStore';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const authUser = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Try to close the popup window if this is one
  useEffect(() => {
    try {
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'PAYPAL_RETURN', success: false }, '*');
        setTimeout(() => window.close(), 500);
      }
    } catch (e) {
      console.log('Could not close popup:', e);
    }
  }, []);

  // Determine back destination based on user role
  const getBackDestination = () => {
    const role = authUser?.role?.toUpperCase();
    if (role === 'WORKER') return '/worker-dashboard';
    if (role === 'EMPLOYER') return '/employer-payments';
    if (role === 'ADMIN') return '/admin';
    if (role === 'SUPPORT') return '/support-dashboard';
    return '/login';
  };

  // Determine retry destination - go back to payment options or subscription
  const getRetryDestination = () => {
    // Check if there was a pending payment (hiring flow)
    const pendingPayment = JSON.parse(localStorage.getItem('homelyserv_pending_payment') || 'null');
    if (pendingPayment?.hireId) {
      return '/payment-options';
    }
    // Default to subscription page for premium payments
    return '/subscription';
  };

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-200 dark:border-gray-700">
        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={32} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Payment Cancelled</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Your payment was cancelled.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          No charges were applied.
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(getRetryDestination())}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            Retry Payment
          </button>
          <button
            onClick={() => navigate(getBackDestination())}
            className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Return to Dashboard
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          You may safely close this window.
        </p>
      </div>
    </div>
  );
};

export default PaymentCancel;