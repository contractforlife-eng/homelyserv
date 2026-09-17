import crypto from 'crypto';
import User from '../models/User.js';
import {
  LINKING_TOKEN_TTL_SECONDS,
  getHomelyMindIntegrationSecret,
} from '../config/homelyMindIntegration.js';

/**
 * HomelyMind account-link token issuer (Phase 1).
 *
 * Token payload (JSON, base64url-encoded):
 *   { homelyServUserId, expiresAt, nonce, signature }
 *
 * signature = HMAC-SHA256(
 *   HOMELYMIND_INTEGRATION_SECRET,
 *   `${homelyServUserId}:${expiresAt}:${nonce}`
 * ) as a hex digest.
 *
 * Security properties:
 * - The HomelyServ user id comes ONLY from the authenticated request
 *   identity (verified JWT -> req.userId -> database user). It is never
 *   taken from the request body.
 * - expiresAt = now + 300 seconds.
 * - nonce = 16 cryptographically secure random bytes (crypto.randomBytes).
 * - No passwords, no JWTs, no HomelyServ secrets, and no sensitive user
 *   fields are ever encoded into the token.
 * - The token carries NO authorization privileges for HomelyMind. It only
 *   certifies "this linking token was issued by HomelyServ for this
 *   HomelyServ user id".
 */

/** Builds the canonical HMAC message for a linking token payload. */
export function buildLinkingTokenMessage({ homelyServUserId, expiresAt, nonce }) {
  return `${homelyServUserId}:${expiresAt}:${nonce}`;
}

/** Computes the HMAC-SHA256 (hex) signature over the canonical message. */
export function signLinkingTokenPayload(payload) {
  const secret = getHomelyMindIntegrationSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(buildLinkingTokenMessage(payload))
    .digest('hex');
}

/** base64url-encodes the JSON payload. */
export function encodeLinkingToken(payload) {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

/** Decodes a base64url token back into its JSON payload. */
export function decodeLinkingToken(token) {
  return JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
}

/**
 * Constant-time signature verification for a decoded payload.
 * Used by tests now and by any future server-side verification path.
 */
export function verifyLinkingTokenSignature(payload) {
  const expected = Buffer.from(signLinkingTokenPayload(payload), 'hex');
  const received = Buffer.from(String(payload.signature ?? ''), 'hex');
  if (expected.length !== received.length || received.length === 0) {
    return false;
  }
  return crypto.timingSafeEqual(expected, received);
}

/**
 * Creates a signed linking token for a HomelyServ user id.
 * Pure helper (no I/O) so it is trivially testable.
 */
export function createLinkingTokenForUser(homelyServUserId, now = Date.now()) {
  const expiresAtMs = now + LINKING_TOKEN_TTL_SECONDS * 1000;
  const nonce = crypto.randomBytes(16).toString('hex'); // 32 hex chars, 128 bits of entropy

  const payload = {
    homelyServUserId,
    expiresAt: expiresAtMs,
    nonce,
    signature: '',
  };
  payload.signature = signLinkingTokenPayload(payload);

  return {
    token: encodeLinkingToken(payload),
    payload,
    expiresAtIso: new Date(expiresAtMs).toISOString(),
  };
}

/**
 * POST /api/account-link/token
 *
 * Issues a short-lived, signed HomelyMind account-link token for the
 * CURRENTLY AUTHENTICATED HomelyServ user. The identity source is strictly:
 * authenticated JWT -> req.userId -> database user.
 *
 * The request body is ignored entirely; a client-supplied user id can never
 * select a different identity.
 */
export async function issueAccountLinkToken(req, res) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  const { token, expiresAtIso } = createLinkingTokenForUser(user._id.toString());

  // Minimum information required by the client. No password/hash, no
  // unrelated user data. The role is display-only for HomelyMind and MUST
  // NOT be converted into HomelyMind authorization privileges.
  return res.status(200).json({
    success: true,
    token,
    expiresAt: expiresAtIso,
    user: {
      id: user._id.toString(),
      role: user.role,
    },
  });
}
