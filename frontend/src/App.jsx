import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { StatusBar, Style } from '@capacitor/status-bar'; // استيراد متحكم شريط الحالة
import { Capacitor } from '@capacitor/core'; // للتحقق من أن التطبيق يعمل على الموبايل وليس المتصفح
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
  return user ? children : <Navigate to="/login" />;
}

export default function App() {
  
  // دالة لتهيئة إعدادات الشاشة الكاملة عند فتح التطبيق
  useEffect(() => {
    const setupStatusBar = async () => {
      // نتحقق أولاً أن التطبيق يعمل كـ Native (أندرويد أو iOS) وليس مجرد متصفح كمبيوتر
      if (Capacitor.isNativePlatform()) {
        try {
          // جعل التطبيق يتمدد خلف شريط الحالة العلوي تماماً
          await StatusBar.setOverlaysWebView({ overlay: true });
          // جعل أيقونات شريط الحالة باللون الداكن لأن خلفية تطبيقك بيضاء
          await StatusBar.setStyle({ style: Style.Light });
        } catch (error) {
          console.log('StatusBar is not available or failed to load:', error);
        }
      }
    };

    setupStatusBar();
  }, []);

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
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}