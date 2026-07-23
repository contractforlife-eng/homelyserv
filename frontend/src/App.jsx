// src/App.jsx - FULLY UPDATED WITH PROPER MESSAGE ROUTING
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';

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
import PaymentOptions from './pages/PaymentOptions';
import WorkerProfileView from './pages/WorkerProfileView';
import PaymentCommission from './pages/PaymentCommission';

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

import { useAuth } from './context/AuthContext';

// Messages Redirect Component
const MessagesRedirect = () => {
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
    } else {
      navigate('/login', { replace: true });
    }
  }, [user, isAuthenticated, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your messages...</p>
      </div>
    </div>
  );
};

// Protected Route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If user is null (during checkAuth), show loading instead of redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const userRole = user.role?.toUpperCase();
  
  if (requiredRole && userRole !== requiredRole.toUpperCase()) {
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
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />

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
        element={
          <ProtectedRoute>
            <Help />
          </ProtectedRoute>
        } 
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
        path="/payment-commission" 
        element={
          <ProtectedRoute>
            <PaymentCommission />
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
        path="/admin/payments" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminPayments />
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
        path="/admin/hires" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminHires />
          </ProtectedRoute>
        } 
      />

      {/* ========== FALLBACK ========== */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;