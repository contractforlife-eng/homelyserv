import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://gas-clapped-copper.ngrok-free.dev'
});


// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('homelyserv_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {

    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      localStorage.removeItem('homelyserv_token');

      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);


export default api;