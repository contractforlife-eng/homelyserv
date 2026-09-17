/**
 * HomelyMind integration configuration (Phase 1: account-link token issuer).
 *
 * This module follows the same fail-fast convention as `jwtSecret.js`:
 * the secret is read lazily, is never logged or printed, and the server
 * refuses to issue tokens when it is missing or too short.
 *
 * Rules:
 * - The secret is shared ONLY between HomelyServ and HomelyMind.
 * - It must be different per environment (dev / staging / production).
 * - It must never be committed to source control.
 * - Linking tokens produced with it expire after 5 minutes (300 seconds).
 * - Linking tokens are intended for HomelyMind account linking ONLY.
 * - HomelyMind must never receive HomelyServ passwords.
 * - HomelyMind must never connect directly to the HomelyServ database.
 */

const MIN_SECRET_LENGTH = 32;

/** Token lifetime in seconds (5 minutes). */
export const LINKING_TOKEN_TTL_SECONDS = 300;

let cachedSecret = null;

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * Returns the shared HomelyMind integration secret.
 *
 * Fails fast in every environment (matching the JWT secret policy):
 * - missing/empty secret -> error
 * - secret shorter than 32 characters -> error
 *
 * The value is never logged, printed, or embedded in error messages.
 */
export function getHomelyMindIntegrationSecret() {
  if (cachedSecret) {
    return cachedSecret;
  }

  const secret = process.env.HOMELYMIND_INTEGRATION_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      '[homelyMindIntegration] HOMELYMIND_INTEGRATION_SECRET is not configured. ' +
        'Set it to the shared HomelyServ<->HomelyMind integration secret before issuing account-link tokens.'
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `[homelyMindIntegration] HOMELYMIND_INTEGRATION_SECRET is too short. It must be at least ${MIN_SECRET_LENGTH} characters.`
    );
  }

  cachedSecret = secret;
  return cachedSecret;
}

/**
 * Returns the base HomelyMind URL (no trailing slash) or '' when unset.
 * Used by outbound HomelyMind calls; not required by the Phase 1 issuer.
 */
export function getHomelyMindUrl() {
  const url = process.env.HOMELYMIND_URL;
  if (!url || url.trim().length === 0) {
    return '';
  }
  return url.trim().replace(/\/+$/, '');
}

/** Exposed for tests only. */
export function __resetHomelyMindIntegrationCacheForTests() {
  cachedSecret = null;
}

export default {
  LINKING_TOKEN_TTL_SECONDS,
  getHomelyMindIntegrationSecret,
  getHomelyMindUrl,
  isProduction,
};
