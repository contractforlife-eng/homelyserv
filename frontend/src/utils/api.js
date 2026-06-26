import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gas-clapped-copper.ngrok-free.dev/api' // Use YOUR current ngrok URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['ngrok-skip-browser-warning'] = 'true';
  } else {
    config.headers['ngrok-skip-browser-warning'] = 'true';
  }
  return config;
});

export default api;