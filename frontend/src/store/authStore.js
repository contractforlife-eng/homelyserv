import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  token: localStorage.getItem('token') || null,
  loading: false,
  error: null,

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
      return { success: false, message: err.response?.data?.message };
    }
  },

  login: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', data);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.token, loading: false });
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
      return { success: false, message: err.response?.data?.message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  }
}));

export default useAuthStore;