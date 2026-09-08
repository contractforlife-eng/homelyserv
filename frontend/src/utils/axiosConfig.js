import axios from 'axios';
import { API_BASE } from '../config/api';
import { getStoredAuthToken, removeStoredAuthTokens } from './storageMaintenance';
import { clearRuntimeAuthToken, getRuntimeAuthToken } from './runtimeAuthToken';
import { StorageService } from '../services/storage.service';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000
});

api.interceptors.request.use(
  (config) => {
    const token = getRuntimeAuthToken() || StorageService.getSyncToken() || getStoredAuthToken();
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
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/forgot-password') ||
      requestUrl.includes('/api/auth/reset-password') ||
      requestUrl.includes('/api/auth/verify-email');

    if (error.response?.data?.code === 'ACCOUNT_SUSPENDED') {
      const isLoginOrRegister = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isLoginOrRegister) {
        sessionStorage.setItem('homelyserv_auth_error', JSON.stringify({ code: 'ACCOUNT_SUSPENDED' }));
      }
      localStorage.removeItem('auth-storage');
      removeStoredAuthTokens();
      clearRuntimeAuthToken();
      if (!isLoginOrRegister && !isAuthEndpoint) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Don't redirect for public endpoints that don't require authentication
      const publicPaths = ['/verify-email', '/forgot-password', '/reset-password', '/login', '/register'];
      const isPublicPath = publicPaths.some(path => 
        requestUrl.includes(path) || window.location.pathname === path
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
