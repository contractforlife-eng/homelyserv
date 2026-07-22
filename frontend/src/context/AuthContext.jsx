// src/context/AuthContext.jsx
// AuthContext is a thin wrapper around useAuthStore (single source of truth)
import React, { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const store = useAuthStore();

  // On mount, verify token with backend via Zustand's checkAuth
  useEffect(() => {
    const initAuth = async () => {
      await store.checkAuth();
    };
    initAuth();
  }, []);

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
