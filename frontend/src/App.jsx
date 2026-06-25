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
import MyHires from './pages/MyHires';
import './i18n';
import './index.css';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
}

// Admin route that doesn't redirect to login
function AdminRoute({ children }) {
  const { user } = useAuthStore();
  if (!user) {
    // Auto-login with admin credentials
    import('./store/authStore').then(({ default: store }) => {
      const { login } = store.getState();
      login({ email: 'emad@homelyserv.com', password: 'killuemad' });
    });
    return <div>Loading admin...</div>;
  }
  return user.role === 'ADMIN' ? children : <Navigate to="/" />;
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
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/my-hires" element={<ProtectedRoute><MyHires /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}