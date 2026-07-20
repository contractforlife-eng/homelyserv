// backend/src/config/jwtSecret.js
//
// PHASE 0 SECURITY FIX (see audit §2.8):
// Previously, three different files each hardcoded their own fallback
// JWT secret (e.g. 'homelyserv_secret_key_2026') that was used silently
// whenever process.env.JWT_SECRET was missing. That meant:
//   1. Tokens could be forged by anyone who read the public source code.
//   2. Different files used different fallback strings, so token
//      verification could break unpredictably if JWT_SECRET was unset
//      in only some places.
//
// This module is the single source of truth for the JWT secret. It is
// read lazily (inside a function, not at module-import time) so it does
// not depend on dotenv having already loaded when this module is first
// imported. There is NO fallback: if JWT_SECRET is missing or too weak,
// every route that needs it fails loudly instead of signing/verifying
// tokens with a secret visible in source control.
//
// Rotating the secret: changing JWT_SECRET invalidates every
// previously-issued token, which forces all logged-in users to sign in
// again. That is expected and desired the first time this fix is
// deployed, since the old hardcoded secrets must be treated as
// compromised (they were committed to a public-readable git history).

const MIN_SECRET_LENGTH = 32;

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is not set. Refusing to sign or verify tokens with a hardcoded fallback secret. " +
      "Set JWT_SECRET in your environment (.env locally; your host's environment variable settings in production). " +
      "Generate one with: openssl rand -hex 32"
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is too short (${secret.length} chars, minimum ${MIN_SECRET_LENGTH}). ` +
      "Generate a strong secret with: openssl rand -hex 32"
    );
  }

  return secret;
}
