import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'homelyserv_access_token';
const REFRESH_TOKEN_KEY = 'homelyserv_refresh_token';
const USER_KEY = 'homelyserv_user_profile';
const LEGACY_TOKEN_KEY = 'homelyserv_token';

let memoryToken: string | null = null;
let memoryUser: Record<string, unknown> | null = null;

// Session generation counter for invalidating stale in-flight operations.
// Incremented on every clearSession / explicit logout.
let sessionGeneration = 0;

// Promise chain queue ensuring FIFO serialization of native preferences operations
let storageQueue: Promise<unknown> = Promise.resolve();

function enqueueOperation<T>(op: (generation: number) => Promise<T>): Promise<T | null> {
  const opGen = sessionGeneration;
  const next = storageQueue
    .catch(() => {}) // Prevent previous rejections from deadlocking future queue operations
    .then(async () => {
      // If the session was invalidated before or during queue processing, abort
      if (opGen !== sessionGeneration) {
        return null;
      }
      return await op(opGen);
    });

  // Keep storageQueue chained to the new operation
  storageQueue = next.catch(() => {});
  return next;
}

export const StorageService = {
  /**
   * For testing & diagnostics: returns the current session generation.
   */
  getSessionGeneration(): number {
    return sessionGeneration;
  },

  /**
   * For testing & synchronization: returns a promise that resolves
   * when all currently enqueued native storage operations have settled.
   */
  async flushQueue(): Promise<void> {
    await storageQueue.catch(() => {});
  },

  /**
   * Initializes tokens and profile into memory and native preferences.
   * Migrates any legacy token from localStorage.
   */
  async bootstrapAndMigrate<T = Record<string, unknown>>(): Promise<{
    token: string | null;
    user: T | null;
  }> {
    const res = await enqueueOperation(async (currentGen) => {
      let token = await this._getNativeToken();
      let user = await this._getNativeUser<T>();

      if (currentGen !== sessionGeneration) return { token: null, user: null };

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
          await this._setNativeToken(legacyToken);
        }

        if (legacyRefreshToken) {
          await this._setNativeRefreshToken(legacyRefreshToken);
          window.localStorage.removeItem('refreshToken');
        }

        if (!user && legacyUser) {
          try {
            user = JSON.parse(legacyUser) as T;
            if (user) {
              await this._setNativeUser(user as Record<string, unknown>);
            }
          } catch {
            // Ignore parse errors on malformed legacy user strings
          }
        }
      }

      if (currentGen !== sessionGeneration) return { token: null, user: null };

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
    });

    return res || { token: null, user: null };
  },

  // Synchronous token getter for immediate Axios interceptor calls
  getSyncToken(): string | null {
    if (memoryToken) return memoryToken;
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(LEGACY_TOKEN_KEY) || null;
    }
    return null;
  },

  // Synchronous user profile getter for immediate store initialization
  getSyncUser<T = Record<string, unknown>>(): T | null {
    if (memoryUser) return memoryUser as T;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw =
          window.localStorage.getItem(USER_KEY) ||
          window.localStorage.getItem('user') ||
          window.localStorage.getItem('userProfile');
        if (raw) {
          const parsed = JSON.parse(raw) as T;
          if (parsed && typeof parsed === 'object') {
            memoryUser = parsed as Record<string, unknown>;
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  },

  // Internal raw Preferences calls
  async _setNativeToken(token: string): Promise<void> {
    try {
      await Preferences.set({ key: TOKEN_KEY, value: token });
    } catch (e) {
      console.warn('[StorageService] Preferences.set token failed:', e);
      throw e;
    }
  },

  async _getNativeToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: TOKEN_KEY });
      return value || null;
    } catch (e) {
      console.warn('[StorageService] Preferences.get token failed:', e);
      return null;
    }
  },

  async _setNativeRefreshToken(refreshToken: string): Promise<void> {
    try {
      await Preferences.set({ key: REFRESH_TOKEN_KEY, value: refreshToken });
    } catch (e) {
      console.warn('[StorageService] Preferences.set refreshToken failed:', e);
      throw e;
    }
  },

  async _getNativeRefreshToken(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: REFRESH_TOKEN_KEY });
      return value || null;
    } catch {
      return null;
    }
  },

  async _setNativeUser(user: Record<string, unknown>): Promise<void> {
    try {
      await Preferences.set({ key: USER_KEY, value: JSON.stringify(user) });
    } catch (e) {
      console.warn('[StorageService] Preferences.set user failed:', e);
      throw e;
    }
  },

  async _getNativeUser<T>(): Promise<T | null> {
    try {
      const { value } = await Preferences.get({ key: USER_KEY });
      if (value) {
        return JSON.parse(value) as T;
      }
    } catch {}
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
    await enqueueOperation(async (currentGen) => {
      try {
        await this._setNativeToken(token);
      } catch {
        // Warning already logged in _setNativeToken
      }
      if (currentGen !== sessionGeneration) {
        // If invalidated while write was pending, ensure native storage is cleaned
        await this._clearNativeKeys().catch(() => {});
      }
    });
  },

  async getToken(): Promise<string | null> {
    const res = await enqueueOperation(async (currentGen) => {
      const value = await this._getNativeToken();
      if (currentGen !== sessionGeneration) return null;

      if (value) {
        memoryToken = value;
        return value;
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        const fallback = window.localStorage.getItem(LEGACY_TOKEN_KEY) || window.localStorage.getItem('token');
        if (fallback) {
          memoryToken = fallback;
          return fallback;
        }
      }

      return memoryToken;
    });

    return res !== undefined ? res : memoryToken;
  },

  // Refresh Token
  async setRefreshToken(refreshToken: string): Promise<void> {
    await enqueueOperation(async (currentGen) => {
      try {
        await this._setNativeRefreshToken(refreshToken);
      } catch {
        // Warning already logged
      }
      if (currentGen !== sessionGeneration) {
        await this._clearNativeKeys().catch(() => {});
      }
    });
  },

  async getRefreshToken(): Promise<string | null> {
    const res = await enqueueOperation(async (currentGen) => {
      const val = await this._getNativeRefreshToken();
      if (currentGen !== sessionGeneration) return null;
      return val;
    });
    return res || null;
  },

  // User Profile Object
  async setUser(user: Record<string, unknown>): Promise<void> {
    memoryUser = user;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(USER_KEY, JSON.stringify(user));
      } catch {}
    }
    await enqueueOperation(async (currentGen) => {
      try {
        await this._setNativeUser(user);
      } catch {
        // Warning already logged
      }
      if (currentGen !== sessionGeneration) {
        await this._clearNativeKeys().catch(() => {});
      }
    });
  },

  async getUser<T>(): Promise<T | null> {
    const res = await enqueueOperation(async (currentGen) => {
      const parsed = await this._getNativeUser<T>();
      if (currentGen !== sessionGeneration) return null;

      if (parsed) {
        memoryUser = parsed as Record<string, unknown>;
        return parsed;
      }

      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          const raw =
            window.localStorage.getItem(USER_KEY) ||
            window.localStorage.getItem('user') ||
            window.localStorage.getItem('userProfile');
          if (raw) {
            const parsedLocal = JSON.parse(raw) as T;
            if (parsedLocal && typeof parsedLocal === 'object') {
              memoryUser = parsedLocal as Record<string, unknown>;
              return parsedLocal;
            }
          }
        } catch {}
      }

      return (memoryUser as T) || null;
    });

    return res !== undefined ? res : (memoryUser as T) || null;
  },

  async _clearNativeKeys(): Promise<void> {
    try {
      await Preferences.remove({ key: TOKEN_KEY });
    } catch (e) {
      console.warn('[StorageService] Preferences.remove token failed:', e);
    }
    try {
      await Preferences.remove({ key: REFRESH_TOKEN_KEY });
    } catch (e) {
      console.warn('[StorageService] Preferences.remove refreshToken failed:', e);
    }
    try {
      await Preferences.remove({ key: USER_KEY });
    } catch (e) {
      console.warn('[StorageService] Preferences.remove user failed:', e);
    }
  },

  // Complete Session Purge (Logout)
  async clearSession(): Promise<void> {
    // 1. Invalidate session generation synchronously and immediately
    sessionGeneration += 1;
    const purgeGen = sessionGeneration;

    // 2. Clear synchronous memory caches
    memoryToken = null;
    memoryUser = null;

    // 3. Clear web storage mirrors immediately
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('authToken');
      window.localStorage.removeItem('accessToken');
      window.localStorage.removeItem(LEGACY_TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
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
      window.sessionStorage.removeItem(USER_KEY);
      window.sessionStorage.removeItem('refreshToken');
    }

    // 4. Enqueue native preferences cleanup in the serialized queue.
    // Notice: if a new login occurs immediately after logout, sessionGeneration will advance,
    // so this purge will NOT wipe the new login's data (purgeGen !== sessionGeneration).
    await enqueueOperation(async (currentGen) => {
      if (currentGen !== purgeGen) {
        // A newer session has already begun! Do not wipe its credentials.
        return;
      }
      await this._clearNativeKeys();
    });
  }
};

export default StorageService;
