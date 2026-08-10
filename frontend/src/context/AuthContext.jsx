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
  
  // Use individual selectors to prevent unnecessary re-renders and effect retriggers
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const login = useAuthStore(state => state.login);
  const logout = useAuthStore(state => state.logout);
  const checkAuth = useAuthStore(state => state.checkAuth);

  // On mount, verify token with backend via Zustand's checkAuth
  // This runs ONLY ONCE per app load/browser refresh, not on every navigation
  useEffect(() => {
    const initAuth = async () => {
      // Always validate auth on initial load
      await checkAuth();
    };
    initAuth();
  }, [checkAuth]);

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
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
