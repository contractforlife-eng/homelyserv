import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'homelyserv_access_token';
const REFRESH_TOKEN_KEY = 'homelyserv_refresh_token';
const USER_KEY = 'homelyserv_user_profile';
const LEGACY_TOKEN_KEY = 'homelyserv_token';

let memoryToken: string | null = null;
let memoryUser: Record<string, unknown> | null = null;

export const StorageService = {
  /**
   * Initializes tokens and profile into memory and native preferences.
   * Migrates any legacy token from localStorage.
   */
  async bootstrapAndMigrate<T = Record<string, unknown>>(): Promise<{
    token: string | null;
    user: T | null;
  }> {
    let token = await this.getToken();
    let user = await this.getUser<T>();

    // Fallback & Migration: Check legacy web localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const legacyToken =
        window.localStorage.getItem('token') ||
        window.localStorage.getItem('authToken') ||
        window.localStorage.getItem('accessToken') ||
        window.localStorage.getItem(LEGACY_TOKEN_KEY);

      const legacyRefreshToken = window.localStorage.getItem('refreshToken');
      const legacyUser = window.localStorage.getItem('user') || window.localStorage.getItem('userProfile');

      if (!token && legacyToken) {
        token = legacyToken;
        await this.setToken(legacyToken);
      }

      if (legacyRefreshToken) {
        await this.setRefreshToken(legacyRefreshToken);
        window.localStorage.removeItem('refreshToken');
      }

      if (!user && legacyUser) {
        try {
          user = JSON.parse(legacyUser) as T;
          if (user) {
            await this.setUser(user as Record<string, unknown>);
          }
        } catch {
          // Ignore parse errors on malformed legacy user strings
        }
      }
    }

    if (token) {
      memoryToken = token;
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
      }
    }

    if (user) {
      memoryUser = user as Record<string, unknown>;
    }

    return { token, user };
  },

  // Synchronous token getter for immediate Axios interceptor calls
  getSyncToken(): string | null {
    if (memoryToken) return memoryToken;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(LEGACY_TOKEN_KEY) || null;
    }
    return null;
  },

  // Access Token
  async setToken(token: string): Promise<void> {
    memoryToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
      } catch {}
    }
    try {
      await Preferences.set({ key: TOKEN_KEY, value: token });
    } catch (e) {
      console.warn('[StorageService] Preferences.set token failed:', e);
    }
  },

  async getToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      if (value) {
        memoryToken = value;
        return value;
      }
    } catch (e) {
      console.warn('[StorageService] Preferences.get token failed:', e);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const fallback = window.localStorage.getItem(LEGACY_TOKEN_KEY) || window.localStorage.getItem('token');
      if (fallback) {
        memoryToken = fallback;
        return fallback;
      }
    }

    return memoryToken;
  },

  // Refresh Token
  async setRefreshToken(refreshToken: string): Promise<void> {
    try {
      await Preferences.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
    } catch (e) {
      console.warn('[StorageService] Preferences.set refreshToken failed:', e);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return value;
    } catch {
      return null;
    }
  },

  // User Profile Object
  async setUser(user: Record<string, unknown>): Promise<void> {
    memoryUser = user;
    try {
      await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
    } catch (e) {
      console.warn('[StorageService] Preferences.set user failed:', e);
    }
  },

  async getUser<T>(): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key: USER_KEY });
      if (value) {
        const parsed = JSON.parse(value) as T;
        memoryUser = parsed as Record<string, unknown>;
        return parsed;
      }
    } catch {}

    return (memoryUser as T) || null;
  },

  // Complete Session Purge (Logout)
  async clearSession(): Promise<void> {
    memoryToken = null;
    memoryUser = null;
    try {
      await Preferences.remove({ key: TOKEN_KEY });
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
      await Preferences.remove({ key: USER_KEY });
    } catch (e) {
      console.warn('[StorageService] Preferences.remove failed:', e);
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem(LEGACY_TOKEN_KEY);
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('userProfile');
      window.localStorage.removeItem('auth-storage');
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem('token');
      window.sessionStorage.removeItem('authToken');
      window.sessionStorage.removeItem('accessToken');
      window.sessionStorage.removeItem(LEGACY_TOKEN_KEY);
      window.sessionStorage.removeItem('refreshToken');
    }
  }
};

export default StorageService;

