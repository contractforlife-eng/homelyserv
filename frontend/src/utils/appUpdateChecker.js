/**
 * Pure functions and storage helpers for Android update notifications.
 * Extracted for deterministic unit testing in plain Node.
 */

export const UPDATE_DISMISSED_KEY_PREFIX = 'homelyserv_update_dismissed_';
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
export const STABLE_RELEASE_MANIFEST_URL = 'https://www.homelyserv.com/downloads/android/release.json';

/**
 * Checks if a newer versionCode is available.
 * 
 * @param {number|string} installedCode
 * @param {number|string} latestCode
 * @returns {boolean}
 */
export const isUpdateAvailable = (installedCode, latestCode) => {
  const installed = parseInt(String(installedCode), 10);
  const latest = parseInt(String(latestCode), 10);
  if (Number.isNaN(installed) || Number.isNaN(latest)) return false;
  return latest > installed;
};

/**
 * Checks if a reminder is currently postponed.
 * 
 * @param {string|number} latestVersionCode
 * @param {Storage} storage
 * @param {number} [now=Date.now()]
 * @returns {boolean}
 */
export const isUpdatePostponed = (latestVersionCode, storage, now = Date.now()) => {
  if (!storage || !latestVersionCode) return false;
  try {
    const raw = storage.getItem(`${UPDATE_DISMISSED_KEY_PREFIX}${latestVersionCode}`);
    if (!raw) return false;
    const dismissedAt = parseInt(raw, 10);
    if (Number.isNaN(dismissedAt)) return false;
    return (now - dismissedAt) < TWENTY_FOUR_HOURS_MS;
  } catch {
    return false;
  }
};

/**
 * Postpones reminder for 24 hours for a specific version.
 * 
 * @param {string|number} latestVersionCode
 * @param {Storage} storage
 * @param {number} [now=Date.now()]
 */
export const postponeUpdate = (latestVersionCode, storage, now = Date.now()) => {
  if (!storage || !latestVersionCode) return;
  try {
    storage.setItem(`${UPDATE_DISMISSED_KEY_PREFIX}${latestVersionCode}`, String(now));
  } catch {
    // Graceful fallback if localStorage is unavailable
  }
};

/**
 * Fetches the stable release manifest with a short timeout.
 * Missing internet, timeout or server errors return null gracefully.
 * 
 * @param {string} [manifestUrl=STABLE_RELEASE_MANIFEST_URL]
 * @param {number} [timeoutMs=4000]
 * @param {Function} [fetchFn=fetch]
 * @returns {Promise<object|null>}
 */
export const fetchLatestManifest = async (
  manifestUrl = STABLE_RELEASE_MANIFEST_URL,
  timeoutMs = 4000,
  fetchFn = (typeof fetch !== 'undefined' ? fetch : null)
) => {
  if (typeof fetchFn !== 'function') return null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const res = await fetchFn(manifestUrl, {
      signal: controller?.signal,
      cache: 'no-cache',
      headers: { 'Accept': 'application/json' },
    });
    if (!res || !res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object') return null;
    if (data.versionCode == null || !data.versionName) return null;
    return data;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
};

/**
 * Coordinates app update verification.
 * 
 * @param {object} params
 * @param {Function} params.isNativePlatform
 * @param {Function} params.getInfo
 * @param {Storage} params.storage
 * @param {string} [params.manifestUrl]
 * @param {number} [params.timeoutMs]
 * @param {Function} [params.fetchFn]
 * @param {number} [params.now]
 * @returns {Promise<object|null>} Details if an update prompt should be displayed, otherwise null.
 */
export const checkForAppUpdate = async ({
  isNativePlatform,
  getInfo,
  storage,
  manifestUrl = STABLE_RELEASE_MANIFEST_URL,
  timeoutMs = 4000,
  fetchFn,
  now = Date.now(),
}) => {
  if (typeof isNativePlatform === 'function' ? !isNativePlatform() : !isNativePlatform) {
    return null; // Do NOT prompt on ordinary website visits
  }

  if (typeof getInfo !== 'function') return null;

  let installed;
  try {
    installed = await getInfo();
  } catch {
    return null;
  }

  if (!installed || (!installed.version && !installed.build)) return null;

  const manifest = await fetchLatestManifest(manifestUrl, timeoutMs, fetchFn);
  if (!manifest) return null;

  const installedCode = installed.build || installed.version;
  if (!isUpdateAvailable(installedCode, manifest.versionCode)) {
    return null;
  }

  if (isUpdatePostponed(manifest.versionCode, storage, now)) {
    return null;
  }

  return {
    installedVersion: installed.version || String(installedCode),
    installedCode: String(installedCode),
    latestVersion: manifest.versionName,
    latestCode: String(manifest.versionCode),
    downloadUrl: manifest.downloadUrl || 'https://www.homelyserv.com/download',
    releaseDate: manifest.releaseDate || '',
  };
};
