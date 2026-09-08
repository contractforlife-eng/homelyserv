import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'homelyserv_access_token';
const REFRESH_TOKEN_KEY = 'homelyserv_refresh_token';
const USER_KEY = 'homelyserv_user_profile';

export const StorageService = {
  /**
   * Reads credentials from native storage.
   * If empty, scans legacy web localStorage for active sessions,
   * migrates them to native preferences, and purges the legacy store.
   */
  async bootstrapAndMigrate<T = Record<string, unknown>>(): Promise<{
    token: string | null;
    user: T | null;
  }> {
    let token = await this.getToken();
    let user = await this.getUser<T>();

    // Fallback: Check legacy web localStorage if native storage is empty
    if (!token && typeof window !== 'undefined' && window.localStorage) {
      const legacyToken =
        window.localStorage.getItem('token') ||
        window.localStorage.getItem('authToken') ||
        window.localStorage.getItem('accessToken') ||
        window.localStorage.getItem('homelyserv_token');

      const legacyRefreshToken = window.localStorage.getItem('refreshToken');
      const legacyUser = window.localStorage.getItem('user') || window.localStorage.getItem('userProfile');

      if (legacyToken) {
        token = legacyToken;
        await this.setToken(legacyToken);
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('authToken');
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('homelyserv_token');
      }

      if (legacyRefreshToken) {
        await this.setRefreshToken(legacyRefreshToken);
        window.localStorage.removeItem('refreshToken');
      }

      if (legacyUser) {
        try {
          user = JSON.parse(legacyUser) as T;
          await this.setUser(user as Record<string, unknown>);
          window.localStorage.removeItem('user');
          window.localStorage.removeItem('userProfile');
        } catch {
          // Ignore parse errors on malformed legacy user strings
        }
      }
    }

    return { token, user };
  },

  // Access Token
  async setToken(token: string): Promise<void> {
    await Preferences.set({ key: TOKEN_KEY, value: token });
  },

  async getToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value;
  },

  // Refresh Token
  async setRefreshToken(refreshToken: string): Promise<void> {
    await Preferences.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
  },

  async getRefreshToken(): Promise<string | null> {
    const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
    return value;
  },

  // User Profile Object
  async setUser(user: Record<string, unknown>): Promise<void> {
    await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
  },

  async getUser<T>(): Promise<T | null> {
    const { value } = await Preferences.get({ key: USER_KEY });
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  // Complete Session Purge (Logout)
  async clearSession(): Promise<void> {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: REFRESH_TOKEN_KEY });
    await Preferences.remove({ key: USER_KEY });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem('homelyserv_token');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('user');
      window.localStorage.removeItem('userProfile');
      window.localStorage.removeItem('auth-storage');
    }
  }
};

export default StorageService;
