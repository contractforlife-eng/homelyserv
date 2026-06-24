import { useEffect } from 'react';
// التعديل هنا: استيراد HashRouter بدلاً من BrowserRouter
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StatusBar, Style } from '@capacitor/status-bar'; 
import { Capacitor } from '@capacitor/core'; 
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

function ProtectedRoute({ children }) {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" replace />; // إضافة replace لضمان التوجيه النظيف
}

export default function App() {
  
  useEffect(() => {
    const setupStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setStyle({ style: Style.Light });
        } catch (error) {
          console.log('StatusBar error:', error);
        }
      }
    };

    setupStatusBar();
  }, []);

  return (
    // التعديل هنا: استخدام HashRouter
    <HashRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/worker-profile" element={<ProtectedRoute><WorkerProfile /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/worker/:id" element={<ProtectedRoute><WorkerView /></ProtectedRoute>} />
        <Route path="/payment/:id" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        {/* مسار احتياطي في حال لم يتعرف على المسار الرئيسي ليعيد توجيهه فوراً */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}