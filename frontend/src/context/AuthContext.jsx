// src/context/AuthContext.jsx
// AuthContext is a thin wrapper around useAuthStore (single source of truth)
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
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
  const [startupReady, setStartupReady] = useState(Capacitor.getPlatform() !== 'android');
  
  // Use individual selectors to prevent unnecessary re-renders and effect retriggers
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  const checkAuth = useAuthStore(state => state.checkAuth);
  const markStartupReady = useCallback(() => setStartupReady(true), []);

  // On mount, verify token with backend via Zustand's checkAuth
  // This runs ONLY ONCE per app load/browser refresh, not on every navigation
  useEffect(() => {
    if (!startupReady) return;

    const initAuth = async () => {
      // Always validate auth on initial load
      const result = await checkAuth();
      if (result?.biometric && (window.location.pathname === '/' || window.location.pathname === '/login')) {
        const restoredUser = useAuthStore.getState().user;
        const role = restoredUser?.role?.toUpperCase();
        const destination = role === 'ADMIN'
          ? '/admin'
          : role === 'EMPLOYER'
            ? '/employer-dashboard'
            : role === 'WORKER'
              ? '/worker-dashboard'
              : role === 'SUPPORT'
                ? '/support-dashboard'
                : role === 'SUPPORT_HELPER'
                  ? '/sup-help'
                  : '/login';
        navigate(destination, { replace: true });
      }
    };
    initAuth();
  }, [checkAuth, navigate, startupReady]);

  // AuthContext exposes authStore values directly — no duplicate state
  const value = {
    user,
    isAuthenticated,
    loading: isLoading,
    login,
    logout: () => {
      logout();
      navigate('/login');
    },
    checkAuth,
    markStartupReady
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
