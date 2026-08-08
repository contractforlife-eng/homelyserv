// src/context/AuthContext.jsx
// AuthContext is a thin wrapper around useAuthStore (single source of truth)
import React, { createContext, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useAuthStore();

  // On mount, verify token with backend via Zustand's checkAuth
  // Skip for public routes that don't require authentication
  useEffect(() => {
    const publicRoutes = ['/verify-email', '/forgot-password', '/reset-password', '/login', '/register', '/about', '/contact', '/terms', '/refund-policy', '/privacy'];
    const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

    const initAuth = async () => {
      if (!isPublicRoute) {
        await store.checkAuth();
      } else {
        // For public routes, just set loading to false without checking auth
        store.setLoading(false);
      }
    };
    initAuth();
  }, [location.pathname]);

  // AuthContext exposes authStore values directly — no duplicate state
  const value = {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    loading: store.isLoading,
    login: store.login,
    logout: () => {
      store.logout();
      navigate('/login');
    },
    checkAuth: store.checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
