// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const token = localStorage.getItem('homelyserv_token');
      const userData = localStorage.getItem('homelyserv_user');
      
      console.log('🔍 Checking auth...');
      console.log('Token exists:', !!token);
      console.log('User data exists:', !!userData);

      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
        console.log('✅ User authenticated:', parsedUser.fullName || parsedUser.email);
        console.log('✅ User role:', parsedUser.role);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('❌ No user data found');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    localStorage.setItem('homelyserv_token', token);
    localStorage.setItem('homelyserv_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    console.log('✅ User logged in:', userData.fullName || userData.email);
  };

  const logout = () => {
    localStorage.removeItem('homelyserv_token');
    localStorage.removeItem('homelyserv_user');
    setUser(null);
    setIsAuthenticated(false);
    console.log('👋 User logged out');
    navigate('/login');
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;