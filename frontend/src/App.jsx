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
import MyHires from './pages/MyHires';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/worker-profile" element={<ProtectedRoute><WorkerProfile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/worker/:id" element={<ProtectedRoute><WorkerView /></ProtectedRoute>} />
        <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/my-hires" element={<ProtectedRoute><MyHires /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}