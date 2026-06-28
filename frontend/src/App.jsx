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
import EmployerDashboard from './pages/EmployerDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import WorkerProfile from './pages/WorkerProfile';
import Payment from './pages/Payment';
import Complaints from './pages/Complaints';
import Notifications from './pages/Notifications';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import ForgotPassword from './pages/ForgotPassword';
import JobDetails from './pages/JobDetails';
import EmployerSearch from './pages/EmployerSearch';
import EmployerProfile from './pages/EmployerProfile';
import EmployerPayments from './pages/EmployerPayments';
import EmployerPending from './pages/EmployerPending';
import EmployerPast from './pages/EmployerPast';
import EmployerOffers from './pages/EmployerOffers';
import WorkerOffers from './pages/WorkerOffers';
import AdminUsers from './pages/AdminUsers';
import AdminPayments from './pages/AdminPayments';
import AdminComplaints from './pages/AdminComplaints';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

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
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />

      {/* Protected Routes - All Users */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/search" 
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/my-hires" 
        element={
          <ProtectedRoute>
            <MyHires />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
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
        path="/complaints" 
        element={
          <ProtectedRoute>
            <Complaints />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/payment/:hireId" 
        element={
          <ProtectedRoute>
            <Payment />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/:id" 
        element={
          <ProtectedRoute>
            <WorkerProfile />
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

      {/* Worker Routes */}
      <Route 
        path="/worker-dashboard" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerDashboard />
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

      {/* Employer Routes */}
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
        path="/employer-profile" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerProfile />
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
        path="/employer-offers" 
        element={
          <ProtectedRoute requiredRole="EMPLOYER">
            <EmployerOffers />
          </ProtectedRoute>
        } 
      />

      {/* Admin Routes */}
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
        path="/admin/settings" 
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <AdminSettings />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;