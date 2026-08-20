import axios from 'axios';
import { API_BASE } from '../config/api';
import { getRuntimeAuthToken } from './runtimeAuthToken';

const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use(
  (config) => {
    const token = getRuntimeAuthToken() || localStorage.getItem('homelyserv_token');
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
    if (error.response?.status === 401) {
      // Don't redirect for public endpoints that don't require authentication
      const publicPaths = ['/verify-email', '/forgot-password', '/reset-password'];
      const isPublicPath = publicPaths.some(path => 
        error.config?.url?.includes(path)
      );
      
      if (!isPublicPath) {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('homelyserv_token');
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
