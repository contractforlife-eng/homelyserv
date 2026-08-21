// src/App.jsx - FULLY UPDATED WITH PROPER MESSAGE ROUTING
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import AnimatedIntro from './components/intro/AnimatedIntro';
import BiometricLockGate from './components/security/BiometricLockGate';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Download from './pages/Download';

// Common Protected Pages
import MyHires from './pages/MyHires';
import Notifications from './pages/Notifications';
import JobDetails from './pages/JobDetails';
import Help from './pages/Help';

// Worker Pages
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerOffers from './pages/WorkerOffers';
import WorkerProfile from './pages/WorkerProfile';
import WorkerComplaints from './pages/WorkerComplaints';
import WorkerMessages from './pages/WorkerMessages';
import WorkerSettings from './pages/WorkerSettings';
import WorkerPayment from './pages/WorkerPayment';
import WorkerJobs from './pages/WorkerJobs';
import WorkerApplications from './pages/WorkerApplications';

// Employer Pages
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerSearch from './pages/EmployerSearch';
import EmployerPending from './pages/EmployerPending';
import EmployerPast from './pages/EmployerPast';
import EmployerPayments from './pages/EmployerPayments';
import EmployerProfile from './pages/EmployerProfile';
import EmployerComplaints from './pages/EmployerComplaints';
import EmployerMessages from './pages/EmployerMessages';
import EmployerSettings from './pages/EmployerSettings';
import EmployerJobs from './pages/EmployerJobs';
import EmployerJobApplicants from './pages/EmployerJobApplicants';
import EmployerPostJob from './pages/EmployerPostJob';
import PaymentOptions from './pages/PaymentOptions';
import WorkerProfileView from './pages/WorkerProfileView';
import EmployerCreateOffer from './pages/EmployerCreateOffer';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Subscription Page
import Subscription from './pages/Subscription';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPayments from './pages/AdminPayments';
import AdminComplaints from './pages/AdminComplaints';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminMessages from './pages/AdminMessages';
import AdminHires from './pages/AdminHires';
import AdminProfile from './pages/AdminProfile';
import AdminUserProfile from './pages/AdminUserProfile';
import AdminFinancialCenter from './pages/AdminFinancialCenter';
import AdminRegistrationGeography from './pages/AdminRegistrationGeography';

// Support Pages
import SupportDashboard from './pages/support/SupportDashboard';
import SupportUsers from './pages/support/SupportUsers';
import SupportUserProfile from './pages/support/SupportUserProfile';
import SupportMessages from './pages/support/SupportMessages';
import SupportSettings from './pages/support/SupportSettings';
import SupportComplaints from './pages/support/SupportComplaints';
import SupportProfile from './pages/support/SupportProfile';
import PublicLiveSupport from './pages/PublicLiveSupport';
import PublicSupportWidget from './components/public-support/PublicSupportWidget';

import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import { initializePushNotifications, setupPushListeners, getPendingPushAction, clearPendingPushAction } from './utils/pushNotifications';

// Messages Redirect Component
const MessagesRedirect = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  
  React.useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    
    // If user is null (during checkAuth), wait for user to be populated
    if (!user) return;
    
const role = user.role?.toUpperCase();
     if (role === 'WORKER') {
       navigate('/worker-messages', { replace: true });
     } else if (role === 'EMPLOYER') {
       navigate('/employer-messages', { replace: true });
     } else if (role === 'ADMIN') {
       navigate('/admin/messages', { replace: true });
     } else if (role === 'SUPPORT') {
       navigate('/support-dashboard', { replace: true });
     } else {
       navigate('/login', { replace: true });
     }
  }, [user, isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('sharedChrome.app.redirectingMessages')}</p>
      </div>
    </div>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading } = useAuth();
  
  // Only block during initial unresolved authentication
  // After auth is resolved, never show full-page loader during SPA navigation
  if (loading && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('sharedChrome.app.loading')}</p>
        </div>
      </div>
    );
  }
  
if (!isAuthenticated) {
     return <Navigate to="/login" replace />;
   }

   if (!user) {
     return (
       <div className="min-h-screen bg-gray-50 flex items-center justify-center">
         <div className="text-center">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
           <p className="mt-4 text-gray-600">{t('sharedChrome.app.loading')}</p>
         </div>
       </div>
     );
   }

   const userRole = user.role?.toUpperCase();

   if (requiredRole && userRole !== requiredRole.toUpperCase()) {
     // Allow ADMIN to access SUPPORT routes
     if (requiredRole.toUpperCase() === 'SUPPORT' && userRole === 'ADMIN') {
       return children;
     }
     
     if (userRole === 'WORKER') {
       return <Navigate to="/worker-dashboard" replace />;
     } else if (userRole === 'EMPLOYER') {
       return <Navigate to="/employer-dashboard" replace />;
     } else if (userRole === 'ADMIN') {
       return <Navigate to="/admin" replace />;
     }
     return <Navigate to="/login" replace />;
   }
  
  return children;
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, user, markStartupReady } = useAuth();
  const publicWidgetPaths = new Set(['/', '/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/about', '/contact', '/terms', '/refund-policy', '/privacy', '/help']);
  const showPublicSupport = !loading && !isAuthenticated && publicWidgetPaths.has(location.pathname);

  const [showIntro, setShowIntro] = useState(() => Capacitor.isNativePlatform());

  useEffect(() => {
    if (!showIntro) return;
    const timer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(timer);
  }, [showIntro]);

  useEffect(() => {
    if (!showIntro) markStartupReady();
  }, [markStartupReady, showIntro]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!isAuthenticated || loading) return;
    initializePushNotifications().catch((err) =>
      console.warn('[Push] Init skipped:', err.message)
    );
    setupPushListeners();
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const navigatePushAction = () => {
      const action = getPendingPushAction();
      if (!action) return;
      if (!isAuthenticated || loading || !user) return;

      const role = user.role?.toUpperCase();

      if (action.conversationId) {
        if (role === 'WORKER') {
          navigate('/worker-messages', { state: { conversationId: action.conversationId } });
        } else if (role === 'EMPLOYER') {
          navigate('/employer-messages', { state: { conversationId: action.conversationId } });
        } else if (role === 'ADMIN') {
          navigate('/admin/messages', { state: { conversationId: action.conversationId } });
        } else if (role === 'SUPPORT') {
          navigate('/support-dashboard', { state: { conversationId: action.conversationId } });
        }
      } else if (action.type === 'NEW_OFFER') {
        if (role === 'WORKER') {
          navigate('/worker/offers');
        } else if (role === 'EMPLOYER') {
          navigate('/employer-jobs');
        }
      } else if (action.type === 'NEW_APPLICATION') {
        if (role === 'EMPLOYER') {
          navigate('/employer-jobs');
        }
      } else if (action.type === 'APPLICATION_STATUS_UPDATE') {
        if (role === 'WORKER') {
          navigate('/worker-jobs');
        }
      } else if (action.type === 'OFFER_ACCEPTED' || action.type === 'OFFER_REJECTED' || action.type === 'OFFER_STATUS_UPDATE') {
        if (role === 'WORKER') {
          navigate('/worker/offers');
        } else if (role === 'EMPLOYER') {
          navigate('/employer-jobs');
        }
      } else if (action.type === 'HIRE_STATUS_UPDATE') {
        navigate('/my-hires');
      } else if (action.type === 'PAYMENT_SUCCESS') {
        if (role === 'EMPLOYER') {
          navigate('/employer-payments');
        } else {
          navigate('/my-hires');
        }
      }

      clearPendingPushAction();
    };

    navigatePushAction();

    const handler = () => navigatePushAction();
    window.addEventListener('push-action', handler);
    return () => window.removeEventListener('push-action', handler);
  }, [isAuthenticated, loading, user, navigate]);

  return (
    <>
      {showIntro && <AnimatedIntro />}
      <BiometricLockGate />
      <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/download" element={<Download />} />

      {/* ========== COMMON PROTECTED ROUTES ========== */}
      
      <Route 
        path="/my-hires" 
        element={
          <ProtectedRoute>
            <MyHires />
          </ProtectedRoute>
        } 
      />
      
      {/* Messages Redirect */}
      <Route 
        path="/messages" 
        element={<MessagesRedirect />} 
      />
      
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/job/:id" 
        element={
          <ProtectedRoute>
            <JobDetails />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/help" 
        element={<Help />} 
      />

      {/* ========== WORKER ROUTES ========== */}
      <Route 
        path="/worker-dashboard" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/offers" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerOffers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-offers" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerOffers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-profile" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-complaints" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerComplaints />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-messages" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerMessages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-settings" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-payment" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerPayment />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-jobs" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerJobs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker-applications" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerApplications />
          </ProtectedRoute>
        } 
      />

      {/* ========== EMPLOYER ROUTES ========== */}
      <Route 
        path="/employer-dashboard" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-search" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerSearch />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-pending" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerPending />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-past" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerPast />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-payments" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerPayments />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-profile" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-complaints" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerComplaints />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-messages" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerMessages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-settings" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment-options" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <PaymentOptions />
          </ProtectedRoute>
        }  
      />
      <Route 
        path="/worker-profile-view" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <WorkerProfileView />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-create-offer" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerCreateOffer />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-post-job" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerPostJob />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-jobs" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerJobs />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/employer-jobs/:id/applicants" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerJobApplicants />
          </ProtectedRoute>
        } 
      />

      {/* ========== SUBSCRIPTION ROUTE ========== */}
      <Route 
        path="/subscription" 
        element={
          <ProtectedRoute>
            <Subscription />
          </ProtectedRoute>
        } 
      />

      {/* ========== PAYPAL CALLBACK ROUTES ========== */}
      {/* These are PUBLIC routes (no ProtectedRoute) because PayPal redirects here
          after payment, and the user may or may not have an active session.
          The pages handle auth internally. */}
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancel" element={<PaymentCancel />} />

      {/* ========== ADMIN ROUTES ========== */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminUsers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users/:id" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminUserProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/payments" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminPayments />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/registration-geography"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminRegistrationGeography />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/financial-center"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminFinancialCenter />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/admin/complaints" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminComplaints />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminReports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/messages" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminMessages />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/hires"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminHires />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/live-support"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <PublicLiveSupport />
          </ProtectedRoute>
        }
      />

      {/* ========== SUPPORT ROUTES ========== */}
      <Route 
        path="/support-dashboard" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support-profile" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support-users" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportUsers />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support/users/:id" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportUserProfile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support-messages" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportMessages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support-settings" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/support-complaints" 
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <SupportComplaints />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/support-live-support"
        element={
          <ProtectedRoute requiredRole="SUPPORT">
            <PublicLiveSupport />
          </ProtectedRoute>
        }
      />

      {/* ========== FALLBACK ========== */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    {showPublicSupport && <PublicSupportWidget />}
    </>
  );
}

export default App;
