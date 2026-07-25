// src/store/themeStore.js - Global dark mode theme store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper to apply/remove the "dark" class on <html>
const applyThemeClass = (isDark) => {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const useThemeStore = create(
  persist(
    (set, get) => ({
      // 'light' | 'dark'
      theme: 'light',

      // Convenience boolean
      get isDark() {
        return get().theme === 'dark';
      },

      // Toggle between light and dark
      toggleTheme: () => {
        const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeClass(nextTheme === 'dark');
        set({ theme: nextTheme });
      },

      // Explicitly set the theme
      setTheme: (newTheme) => {
        const normalized = newTheme === 'dark' ? 'dark' : 'light';
        applyThemeClass(normalized === 'dark');
        set({ theme: normalized });
      },

      // Apply the persisted theme to the DOM on app startup
      initializeTheme: () => {
        const { theme } = get();
        applyThemeClass(theme === 'dark');
      },
    }),
    {
      name: 'homelyserv-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

export default useThemeStore;