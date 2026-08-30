import axios from 'axios';
import { API_BASE } from '../config/api';
import { getStoredAuthToken, removeStoredAuthTokens } from './storageMaintenance';
import { clearRuntimeAuthToken, getRuntimeAuthToken } from './runtimeAuthToken';
import { Capacitor } from '@capacitor/core';

const isAndroidCapacitor = Capacitor.getPlatform() === 'android';

const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use(
  (config) => {
    const token = getRuntimeAuthToken() || (isAndroidCapacitor ? null : getStoredAuthToken());
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
      const isLoginOrRegister = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isLoginOrRegister) {
        sessionStorage.setItem('homelyserv_auth_error', JSON.stringify({ code: 'ACCOUNT_SUSPENDED' }));
      }
      localStorage.removeItem('auth-storage');
      removeStoredAuthTokens();
      clearRuntimeAuthToken();
      if (!isLoginOrRegister) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Don't redirect for public endpoints that don't require authentication
      const publicPaths = ['/verify-email', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => 
        error.config?.url?.includes(path)
      );
      
      if (!isPublicPath) {
        localStorage.removeItem('auth-storage');
        removeStoredAuthTokens();
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
