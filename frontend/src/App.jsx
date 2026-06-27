import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';

// Import pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
<<<<<<< HEAD
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
=======
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import WorkerProfile from './pages/WorkerProfile';
import WorkerView from './pages/WorkerView';
import MyHires from './pages/MyHires';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4

function App() {
  const { checkAuth, language } = useAuthStore();

  React.useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  React.useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
<<<<<<< HEAD
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
=======
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/worker/:id" element={<WorkerProfile />} />
        <Route path="/worker-dashboard" element={<WorkerView />} />
        <Route path="/my-hires" element={<MyHires />} />
        <Route path="/payment/:hireId" element={<Payment />} />
        <Route path="/admin" element={<AdminDashboard />} />
>>>>>>> e76e870126227e85229ba721aadc59dc43db8af4
      </Routes>
    </div>
  );
}

export default App;