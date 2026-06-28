import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import MyHires from './pages/MyHires';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminPayments from './pages/AdminPayments';
import AdminComplaints from './pages/AdminComplaints';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminMessages from './pages/AdminMessages';
import EmployerDashboard from './pages/EmployerDashboard';
import EmployerSearch from './pages/EmployerSearch';
import EmployerPending from './pages/EmployerPending';
import EmployerPast from './pages/EmployerPast';
import EmployerPayments from './pages/EmployerPayments';
import EmployerProfile from './pages/EmployerProfile';
import EmployerComplaints from './pages/EmployerComplaints';
import EmployerMessages from './pages/EmployerMessages';
import EmployerSettings from './pages/EmployerSettings';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerOffers from './pages/WorkerOffers';
import WorkerProfile from './pages/WorkerProfile';
import WorkerComplaints from './pages/WorkerComplaints';
import WorkerMessages from './pages/WorkerMessages';
import WorkerSettings from './pages/WorkerSettings';
import Payment from './pages/Payment';
import Notifications from './pages/Notifications';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import JobDetails from './pages/JobDetails';

// Protected Route wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const userData = localStorage.getItem('user');
  if (!userData) {
    return <Navigate to="/login" replace />;
  }
  
  const user = JSON.parse(userData);
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />

      {/* ========== COMMON PROTECTED ROUTES ========== */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/my-hires" element={<ProtectedRoute><MyHires /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/payment/:hireId" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
      <Route path="/job/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />

      {/* ========== WORKER ROUTES ========== */}
      <Route path="/worker-dashboard" element={<ProtectedRoute requiredRole="WORKER"><WorkerDashboard /></ProtectedRoute>} />
      <Route path="/worker-offers" element={<ProtectedRoute requiredRole="WORKER"><WorkerOffers /></ProtectedRoute>} />
      <Route path="/worker-profile" element={<ProtectedRoute requiredRole="WORKER"><WorkerProfile /></ProtectedRoute>} />
      <Route path="/worker-complaints" element={<ProtectedRoute requiredRole="WORKER"><WorkerComplaints /></ProtectedRoute>} />
      <Route path="/worker-messages" element={<ProtectedRoute requiredRole="WORKER"><WorkerMessages /></ProtectedRoute>} />
      <Route path="/worker-settings" element={<ProtectedRoute requiredRole="WORKER"><WorkerSettings /></ProtectedRoute>} />

      {/* ========== EMPLOYER ROUTES ========== */}
      <Route path="/employer-dashboard" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerDashboard /></ProtectedRoute>} />
      <Route path="/employer-search" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerSearch /></ProtectedRoute>} />
      <Route path="/employer-pending" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerPending /></ProtectedRoute>} />
      <Route path="/employer-past" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerPast /></ProtectedRoute>} />
      <Route path="/employer-payments" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerPayments /></ProtectedRoute>} />
      <Route path="/employer-profile" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerProfile /></ProtectedRoute>} />
      <Route path="/employer-complaints" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerComplaints /></ProtectedRoute>} />
      <Route path="/employer-messages" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerMessages /></ProtectedRoute>} />
      <Route path="/employer-settings" element={<ProtectedRoute requiredRole="EMPLOYER"><EmployerSettings /></ProtectedRoute>} />

      {/* ========== ADMIN ROUTES ========== */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute requiredRole="ADMIN"><AdminUsers /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute requiredRole="ADMIN"><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/complaints" element={<ProtectedRoute requiredRole="ADMIN"><AdminComplaints /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute requiredRole="ADMIN"><AdminReports /></ProtectedRoute>} />
      <Route path="/admin/messages" element={<ProtectedRoute requiredRole="ADMIN"><AdminMessages /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ADMIN"><AdminSettings /></ProtectedRoute>} />

      {/* ========== FALLBACK ========== */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;