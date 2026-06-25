import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import WorkerProfile from './pages/WorkerProfile';
import Search from './pages/Search';
import WorkerView from './pages/WorkerView';
import Payment from './pages/Payment';
import AdminDashboard from './pages/AdminDashboard';
import './i18n';
import './index.css';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A2E',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '14px',
          },
          success: {
            icon: '✅',
            style: {
              background: '#1E8449',
              color: '#fff',
            }
          },
          error: {
            icon: '❌',
            style: {
              background: '#C0392B',
              color: '#fff',
            }
          }
        }}
      />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/worker-profile" element={<ProtectedRoute><WorkerProfile /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
          <Route path="/worker/:id" element={<ProtectedRoute><WorkerView /></ProtectedRoute>} />
          <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}" " 
