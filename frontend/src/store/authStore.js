import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// API base URL - must match backend mount point /api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      language: localStorage.getItem('homelyserv_language') || 'en',
      
      // Registration
      register: async (userData, userType) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            ...userData,
            userType
          });
          
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // Store token in axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },
      
      // Login
      login: async (email, password, role) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_URL}/auth/login`, {
            email,
            password,
            role
          });
          
          const { user, token } = response.data;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          
          // Store token in axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          return { success: true, user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },
      
      // Logout
      logout: () => {
        // Clear axios headers
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        
        // Clear persisted storage
        localStorage.removeItem('homelyserv_token');
        
        return { success: true };
      },
      
      // Check if user is authenticated (verify token)
      checkAuth: async () => {
        const { token } = get();
        
        if (!token) {
          set({ user: null, isAuthenticated: false, loading: false });
          return { success: false };
        }
        
        try {
          // Verify token with server
          console.log('🔍 Auth verify URL:', `${API_URL}/api/auth/verify`);
          console.log('🔍 Token exists:', !!token);
          
          const response = await axios.get(`${API_URL}/api/auth/verify`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          console.log('🔍 Response status:', response.status);
          
          if (response.data?.success && response.data?.user) {
            const userData = response.data.user;
            // Normalize role to uppercase to prevent case-mismatch routing loops
            userData.role = userData.role?.toUpperCase();
            console.log('🔍 Returned user role:', userData.role);
            
            set({
              user: userData,
              token,
              isAuthenticated: true,
              loading: false,
              error: null
            });
            return { success: true };
          } else {
            // Token invalid
            get().logout();
            return { success: false };
          }
        } catch (error) {
          // Token verification failed
          get().logout();
          return { success: false };
        }
      },
      
      // Update user profile
      updateProfile: async (userData) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = get();
          const response = await axios.put(`${API_URL}/auth/profile`, userData, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
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
      
      // Change password
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = get();
          await axios.post(`${API_URL}/auth/change-password`, {
            currentPassword,
            newPassword
          }, {
            headers: {
              Authorization: `Bearer ${token}`
            }
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
      
      // Forgot password - send reset email
      forgotPassword: async (email) => {
        set({ isLoading: true, error: null });
        try {
          await axios.post(`${API_URL}/auth/forgot-password`, { email });
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
      
      // Reset password with token
      resetPassword: async (token, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await axios.post(`${API_URL}/auth/reset-password`, {
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
      
      // Upload profile photo
      uploadProfilePhoto: async (file) => {
        set({ isLoading: true, error: null });
        try {
          const { token } = get();
          const formData = new FormData();
          formData.append('photo', file);
          
          const response = await axios.post(`${API_URL}/auth/upload-photo`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
          
          set({
            user: response.data.user,
            isLoading: false,
            error: null
          });
          
          return { success: true, user: response.data.user };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Photo upload failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },
      
      // Set language
      setLanguage: (lang) => {
        set({ language: lang });
        localStorage.setItem('homelyserv_language', lang);
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = lang;
      },
      
      // Clear error
      clearError: () => {
        set({ error: null });
      },
      
      // Get user role
      getUserRole: () => {
        const { user } = get();
        return user?.role || null;
      },
      
      // Check if user is worker
      isWorker: () => {
        const { user } = get();
        return user?.role === 'worker';
      },
      
      // Check if user is employer
      isEmployer: () => {
        const { user } = get();
        return user?.role === 'employer';
      },
      
      // Check if user is admin
      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
      
      // Get user's full name
      getUserName: () => {
        const { user } = get();
        return user?.fullName || user?.name || 'User';
      },
      
      // Get user's email
      getUserEmail: () => {
        const { user } = get();
        return user?.email || '';
      },
      
      // Get user's profile completion status
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
      
      // Reset store (for testing)
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
        delete axios.defaults.headers.common['Authorization'];
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