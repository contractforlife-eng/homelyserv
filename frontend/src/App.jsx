// frontend/src/App.jsx
import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Import pages
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
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
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
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">🏠 HomelyServ</h1>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-red-600">Home</Link>
            <Link to="/login" className="text-gray-600 hover:text-red-600">Login</Link>
            <Link to="/register" className="text-gray-600 hover:text-red-600">Register</Link>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center mt-10">
          <h1 className="text-4xl font-bold text-gray-800">Welcome to HomelyServ</h1>
          <p className="text-gray-600 mt-4 text-lg">Your trusted platform for home services</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/register" className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Get Started
            </Link>
            <Link to="/search" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Browse Workers
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
