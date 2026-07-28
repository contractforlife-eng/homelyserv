import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const normalizeUser = (userData) => {
  if (!userData) return null;
  const normalized = { ...userData };
  if (normalized._id && !normalized.id) {
    normalized.id = normalized._id;
  }
  if (normalized.role) {
    normalized.role = String(normalized.role).toUpperCase();
  }
  return normalized;
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      language: localStorage.getItem('homelyserv_language') || 'en',

      register: async (userData, userType) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/auth/register', {
            ...userData,
            userType
          });

          const { user, token } = response.data;
          const normalizedUser = normalizeUser(user);

          set({
            user: normalizedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          localStorage.setItem('homelyserv_token', token);

          return { success: true, user: normalizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      login: async (email, password, role) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/auth/login', {
            email,
            password,
            role
          });

          const { user, token } = response.data;
          const normalizedUser = normalizeUser(user);

          set({
            user: normalizedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          localStorage.setItem('homelyserv_token', token);

          return { success: true, user: normalizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });

        localStorage.removeItem('homelyserv_token');
        localStorage.removeItem('auth-storage');

        return { success: true };
      },

      setAuth: (user, token) => {
        const normalizedUser = normalizeUser(user);
        set({
          user: normalizedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        localStorage.setItem('homelyserv_token', token);
        return { success: true, user: normalizedUser };
      },

      checkAuth: async () => {
        set({ isLoading: true });

        const { token } = get();

        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false
          });
          return { success: false };
        }

        try {
          const response = await api.get('/api/auth/verify');

          if (response.data?.success && response.data?.user) {
            const normalizedUser = normalizeUser(response.data.user);
            set({
              user: normalizedUser,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });

            return { success: true };
          }

          get().logout();

          set({
            isLoading: false
          });

          return { success: false };

        } catch (error) {

          get().logout();

          set({
            isLoading: false
          });

          return { success: false };
        }
      },

      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/api/auth/profile', userData);

          set({
            user: response.data.user,
            isLoading: false,
            error: null
          });

          return { success: true, user: response.data.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Profile update failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/api/auth/change-password', {
            currentPassword,
            newPassword
          });

          set({ isLoading: false, error: null });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password change failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/api/auth/forgot-password', { email });
          set({ isLoading: false, error: null });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password reset request failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/api/auth/reset-password', {
            token,
            newPassword
          });
          set({ isLoading: false, error: null });
          return { success: true };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Password reset failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      uploadProfilePhoto: async (file) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new FormData();
          formData.append('photo', file);

          const response = await api.post('/api/auth/upload-photo', formData);

          const normalizedUser = normalizeUser(response.data.user);

          set({
            user: normalizedUser,
            isLoading: false,
            error: null
          });

          return { success: true, user: normalizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Photo upload failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      setLanguage: (lang) => {
        set({ language: lang });
        localStorage.setItem('homelyserv_language', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },

      clearError: () => {
        set({ error: null });
      },

      getUserRole: () => {
        const { user } = get();
        return user?.role || null;
      },

      isWorker: () => {
        const { user } = get();
        return user?.role?.toUpperCase() === 'WORKER';
      },

      isEmployer: () => {
        const { user } = get();
        return user?.role?.toUpperCase() === 'EMPLOYER';
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role?.toUpperCase() === 'ADMIN';
      },

      getUserName: () => {
        const { user } = get();
        return user?.fullName || user?.name || 'User';
      },

      getUserEmail: () => {
        const { user } = get();
        return user?.email || '';
      },

      updateSettings: async (settings) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.put('/api/auth/settings', { settings });

          set({
            user: response.data.user,
            isLoading: false,
            error: null
          });

          return { success: true, user: response.data.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Settings update failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      getProfileCompletion: () => {
        const { user } = get();
        if (!user) return 0;

        const fields = ['fullName', 'email', 'phone', 'city'];
        if (user.role === 'worker') {
          fields.push('category', 'experienceYears', 'expectedSalary', 'skills');
        }
        if (user.role === 'employer') {
          fields.push('companyName', 'companyType');
        }

        const filled = fields.filter(field => user[field] && user[field] !== '');
        return Math.round((filled.length / fields.length) * 100);
      },

      reset: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          language: 'en'
        });
        localStorage.removeItem('homelyserv_token');
        localStorage.removeItem('auth-storage');
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        language: state.language
      })
    }
  )
);

export default useAuthStore;
