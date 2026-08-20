const LEGACY_CACHE_KEYS = [
  'homelyserv_users',
  'homelyserv_profiles',
  'homelyserv_transactions',
  'all_payments',
  'user',
  'auth-storage',
];

const JSON_KEYS = new Set([...LEGACY_CACHE_KEYS, 'homelyserv_public_support_session']);
const BOUNDED_KEYS = { 'auth-storage':65_536, 'homelyserv_public_support_session':1_024 };
const AUTH_TOKEN_KEY = 'homelyserv_token';

export const isQuotaExceededError = (error) => error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014;

export function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
}

export function removeStoredAuthTokens() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function cleanupObsoleteHomelyServStorage() {
  const removed = [];
  for (const key of LEGACY_CACHE_KEYS) {
    if (localStorage.getItem(key) !== null) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  // Malformed HomelyServ JSON cannot be used safely. Remove only the
  // affected application-owned key, never unrelated origin storage.
  for (const key of JSON_KEYS) {
    const value = localStorage.getItem(key);
    if (value === null) continue;
    try { JSON.parse(value); } catch {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  for (const [key, maximumLength] of Object.entries(BOUNDED_KEYS)) {
    const value = localStorage.getItem(key);
    if (value !== null && value.length > maximumLength) {
      localStorage.removeItem(key);
      removed.push(key);
    }
  }

  if (import.meta.env?.DEV && removed.length) {
    console.warn('[Storage] Removed obsolete HomelyServ cache keys to recover browser quota', removed);
  }
  return removed;
}

export function getStorageAudit() {
  const keys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    const value = localStorage.getItem(key) || '';
    keys.push({ key, bytes: new Blob([value]).size });
  }
  return keys.sort((a, b) => b.bytes - a.bytes);
}

export function persistAuthToken(token, { remember = true } = {}) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 16_384 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
    return { success:false, error:'Invalid authentication token format.' };
  }
  const targetStorage = remember ? localStorage : sessionStorage;
  const otherStorage = remember ? sessionStorage : localStorage;
  try {
    targetStorage.setItem(AUTH_TOKEN_KEY, token);
    otherStorage.removeItem(AUTH_TOKEN_KEY);
    return { success:true };
  } catch (error) {
    if (!isQuotaExceededError(error)) return { success:false, error:'Authentication storage is unavailable.' };
    cleanupObsoleteHomelyServStorage();
    try {
      targetStorage.setItem(AUTH_TOKEN_KEY, token);
      otherStorage.removeItem(AUTH_TOKEN_KEY);
      return { success:true, recovered:true };
    } catch (retryError) {
      if (import.meta.env?.DEV) console.error('[AuthStorage] Token persistence failed after scoped cleanup', { name:retryError?.name, tokenBytes:new Blob([token]).size });
      return { success:false, error:'Browser storage is full. Remove old site data and try again.' };
    }
  }
}
