import axios from 'axios';

const api = axios.create({
  // استخدام المتغير أو الرابط الاحتياطي
  baseURL: import.meta.env.VITE_API_URL || 'https://gas-clapped-copper.ngrok-free.dev'
});

export default api;

// Request interceptor to add token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage') 
      ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.token 
      : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      // Clear auth state and redirect to login
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('homelyserv_token');
      localStorage.removeItem('homelyserv_user');
      
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;