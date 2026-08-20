import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import { disconnectSocket } from '../utils/socket';
import { changeLanguageGlobal } from '../i18n';
import { persistAuthToken } from '../utils/storageMaintenance';
import { revokeCurrentDeviceToken } from '../utils/pushNotifications';
import { Capacitor } from '@capacitor/core';
import {
  isAvailable as getBiometricAvailability,
  isEnabled as getBiometricEnabled,
  enable as enableNativeBiometric,
  unlock as unlockNativeBiometric,
  disable as disableNativeBiometric
} from '../native/biometricUnlock';
import { clearRuntimeAuthToken, getRuntimeAuthToken, setRuntimeAuthToken } from '../utils/runtimeAuthToken';

const storedAuthToken = localStorage.getItem('homelyserv_token');
const isAndroidCapacitor = Capacitor.getPlatform() === 'android';
let activeAuthCheck = null;

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
      token: storedAuthToken,
      isAuthenticated: isAndroidCapacitor ? false : Boolean(storedAuthToken),
      isLoading: true,
      error: null,
      biometricLocked: false,
      biometricEnabled: false,
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

          const persisted = persistAuthToken(token);
          if (!persisted.success) throw new Error(persisted.error);
          setRuntimeAuthToken(token);

          set({
            user: normalizedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true, user: normalizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
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

          const persisted = persistAuthToken(token);
          if (!persisted.success) throw new Error(persisted.error);
          setRuntimeAuthToken(token);

          set({
            user: normalizedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          return { success: true, user: normalizedUser };
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please check your credentials.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, error: errorMessage };
        }
      },

      logout: async () => {
        disconnectSocket();

        const token = get().token || localStorage.getItem('homelyserv_token') || getRuntimeAuthToken();
        if (token) {
          revokeCurrentDeviceToken().catch((err) =>
            console.warn('[Push] Logout revocation failed:', err)
          );
        }

        if (isAndroidCapacitor) {
          try {
            await disableNativeBiometric();
          } catch (error) {
            console.warn('[Biometric] Logout cleanup failed:', error?.code || 'DISABLE_FAILED');
          }
        }

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          biometricLocked: false,
          biometricEnabled: false
        });

        localStorage.removeItem('homelyserv_token');
        localStorage.removeItem('auth-storage');
        clearRuntimeAuthToken();

        return { success: true };
      },

      setAuth: (user, token) => {
        return get().restoreAuth(user, token, { persist: true });
      },

      restoreAuth: (user, token, { persist = true } = {}) => {
        const normalizedUser = normalizeUser(user);
        if (persist) {
          const persisted = persistAuthToken(token);
          if (!persisted.success) {
            set({ user:null, token:null, isAuthenticated:false, isLoading:false, error:persisted.error });
            return { success:false, error:persisted.error };
          }
        }
        setRuntimeAuthToken(token);
        set({
          user: normalizedUser,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          biometricLocked: false
        });
        return { success: true, user: normalizedUser };
      },

      checkAuth: async () => {
        if (activeAuthCheck) return activeAuthCheck;

        activeAuthCheck = (async () => {
          set({ isLoading: true });

          let token = get().token || localStorage.getItem('homelyserv_token') || getRuntimeAuthToken();
          let persistSession = true;

          if (isAndroidCapacitor) {
            try {
              const enabledState = await getBiometricEnabled();
              if (enabledState?.enabled) {
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: true,
                  biometricLocked: true,
                  biometricEnabled: true
                });

                const unlocked = await unlockNativeBiometric();
                token = unlocked?.token;
                persistSession = false;
                if (!token) throw { code: 'SECURE_TOKEN_MISSING' };
              } else {
                if (enabledState?.reason === 'KEY_INVALIDATED') {
                  await disableNativeBiometric().catch(() => {});
                  localStorage.removeItem('homelyserv_token');
                  set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    biometricLocked: false,
                    biometricEnabled: false,
                    error: null
                  });
                  return { success: false, biometricInvalidated: true };
                }
                set({ biometricEnabled: false });
              }
            } catch (error) {
              clearRuntimeAuthToken();
              if (error?.code === 'USER_CANCELLED' || error?.code === 'BIOMETRIC_AUTHENTICATION_FAILED' || error?.code === 'BIOMETRIC_LOCKOUT') {
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: false,
                  biometricLocked: true,
                  biometricEnabled: true,
                  error: null
                });
                return { success: false, biometricCancelled: true };
              }

              try {
                await disableNativeBiometric();
              } catch (disableError) {
                console.warn('[Biometric] Invalid enrollment cleanup failed:', disableError?.code || 'DISABLE_FAILED');
              }
              localStorage.removeItem('homelyserv_token');
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                biometricLocked: false,
                biometricEnabled: false,
                error: null
              });
              return { success: false, biometricUnavailable: true };
            }
          }

          if (!token) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              biometricLocked: false
            });
            return { success: false };
          }

          try {
            setRuntimeAuthToken(token);
            const response = await api.get('/api/auth/verify');

            if (response.data?.success && response.data?.user) {
              const restored = get().restoreAuth(response.data.user, token, { persist: persistSession });
              if (!restored.success) throw new Error(restored.error);

              if (isAndroidCapacitor && !persistSession) {
                localStorage.removeItem('homelyserv_token');
              }
              return { success: true, biometric: !persistSession };
            }

            throw new Error('Session verification failed');
          } catch (error) {
            clearRuntimeAuthToken();
            if (isAndroidCapacitor && !persistSession) {
              try {
                await disableNativeBiometric();
              } catch (disableError) {
                console.warn('[Biometric] Rejected-token cleanup failed:', disableError?.code || 'DISABLE_FAILED');
              }
            }
            localStorage.removeItem('homelyserv_token');
            localStorage.removeItem('auth-storage');
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              biometricLocked: false,
              biometricEnabled: false
            });
            return { success: false };
          }
        })();

        try {
          return await activeAuthCheck;
        } finally {
          activeAuthCheck = null;
        }
      },

      enableBiometricUnlock: async () => {
        if (!isAndroidCapacitor) return { success: false, error: 'ANDROID_ONLY' };

        const token = get().token || getRuntimeAuthToken() || localStorage.getItem('homelyserv_token');
        if (!token) return { success: false, error: 'SECURE_TOKEN_MISSING' };

        try {
          const availability = await getBiometricAvailability();
          if (!availability?.available) {
            return { success: false, error: availability?.code || 'BIOMETRIC_UNAVAILABLE' };
          }

          await enableNativeBiometric(token);
          localStorage.removeItem('homelyserv_token');
          setRuntimeAuthToken(token);
          set({ token, biometricEnabled: true });
          return { success: true };
        } catch (error) {
          return { success: false, error: error?.code || 'BIOMETRIC_ENABLE_FAILED' };
        }
      },

      disableBiometricUnlock: async () => {
        if (!isAndroidCapacitor) return { success: false, error: 'ANDROID_ONLY' };

        const token = get().token || getRuntimeAuthToken();
        if (token) {
          const persisted = persistAuthToken(token);
          if (!persisted.success) return { success: false, error: persisted.error };
        }

        try {
          await disableNativeBiometric();
          set({ biometricEnabled: false });
          return { success: true };
        } catch (error) {
          return { success: false, error: error?.code || 'BIOMETRIC_DISABLE_FAILED' };
        }
      },

      useNormalLogin: async () => {
        if (isAndroidCapacitor) {
          try {
            await disableNativeBiometric();
          } catch (error) {
            console.warn('[Biometric] Normal-login cleanup failed:', error?.code || 'DISABLE_FAILED');
          }
        }
        clearRuntimeAuthToken();
        localStorage.removeItem('homelyserv_token');
        localStorage.removeItem('auth-storage');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          biometricLocked: false,
          biometricEnabled: false,
          error: null
        });
        return { success: true };
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

      verifyEmail: async (token) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);

          if (response.data?.success && response.data?.user) {
            const normalizedUser = normalizeUser(response.data.user);
            set({
              user: normalizedUser,
              isLoading: false,
              error: null
            });
            return { success: true, status: response.data.status, user: normalizedUser };
          }

          set({ isLoading: false, error: null });
          return { success: false, status: response.data?.status, error: response.data?.message };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Verification failed.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, status: error.response?.data?.status, error: errorMessage };
        }
      },

      resendVerification: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/api/auth/resend-verification');
          set({ isLoading: false, error: null });
          return { success: true, status: response.data?.status, message: response.data?.message };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Failed to resend verification email.';
          set({
            isLoading: false,
            error: errorMessage
          });
          return { success: false, status: error.response?.data?.status, error: errorMessage };
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
          return { success: false, error: errorMessage, status: error.response?.status };
        }
      },

      setLanguage: (lang) => {
        // Delegate to the global i18n helper (updates i18n, persists to
        // localStorage and applies RTL/LTR) so there is one source of truth.
        changeLanguageGlobal(lang);
        set({ language: lang });
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

      isSupport: () => {
        const { user } = get();
        return user?.role?.toUpperCase() === 'SUPPORT';
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

      updatePreferredCurrency: async (preferredCurrency) => {
        try {
          const response = await api.patch('/api/auth/preferences/currency', {
            preferredCurrency
          });

          set((state) => ({
            user: state.user
              ? { ...state.user, preferredCurrency: response.data.preferredCurrency }
              : state.user,
            error: null
          }));

          return {
            success: true,
            preferredCurrency: response.data.preferredCurrency,
            effectiveCurrency: response.data.effectiveCurrency
          };
        } catch (error) {
          const errorMessage = error.response?.data?.message || 'Currency preference update failed.';
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
        clearRuntimeAuthToken();
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        language: state.language
      }),
      merge: (persistedState, currentState) => {
        const token = localStorage.getItem('homelyserv_token');
        return {
          ...currentState,
          language: persistedState?.language || currentState.language,
          token,
          isAuthenticated: Boolean(token),
        };
      }
    }
  )
);

export default useAuthStore;
