import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { requireAuth } from './utils/authHelpers';

// Import pages (you'll need to create these)
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Search from './pages/Search';
import WorkerProfile from './pages/WorkerProfile';
import WorkerView from './pages/WorkerView';
import EmployerView from './pages/EmployerView';
import AdminDashboard from './pages/AdminDashboard';
import MyHires from './pages/MyHires';
import Payment from './pages/Payment';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    navigate('/');
    return null;
  }

  return children;
};

function App() {
  const { checkAuth, language } = useAuthStore();

  useEffect(() => {
    // Set document direction based on language
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    // Check authentication on app load
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/search" element={<Search />} />
        <Route path="/worker/:id" element={<WorkerProfile />} />

        {/* Worker Routes */}
        <Route path="/worker-dashboard" element={
          <ProtectedRoute requiredRole="worker">
            <WorkerView />
          </ProtectedRoute>
        } />

        {/* Employer Routes */}
        <Route path="/employer-dashboard" element={
          <ProtectedRoute requiredRole="employer">
            <EmployerView />
          </ProtectedRoute>
        } />
        <Route path="/my-hires" element={
          <ProtectedRoute requiredRole="employer">
            <MyHires />
          </ProtectedRoute>
        } />
        <Route path="/payment/:hireId" element={
          <ProtectedRoute requiredRole="employer">
            <Payment />
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;