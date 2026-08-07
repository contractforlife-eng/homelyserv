// backend/src/services/verificationService.js
// ============================================================
// EMAIL VERIFICATION SERVICE
// ============================================================
// Handles token generation, hashing, verification, and resend logic.
// Raw tokens are NEVER stored in the database - only SHA-256 hashes.
// ============================================================
import crypto from 'crypto';
import User from '../models/User.js';
import { sendVerificationEmail } from './emailService.js';

// ============================================================
// CONSTANTS
// ============================================================
const TOKEN_BYTES = 32; // 32 bytes minimum (256 bits)
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// ============================================================
// TOKEN GENERATION & HASHING
// ============================================================

/**
 * Generate a cryptographically secure random token.
 * @returns {string} - URL-safe base64 token
 */
export const generateVerificationToken = () => {
  return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
};

/**
 * Hash a raw token using SHA-256.
 * @param {string} rawToken - The raw token to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
export const hashToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Generate a token hash and expiration date for a user.
 * @returns {Object} - { rawToken, tokenHash, expiresAt }
 */
export const createTokenRecord = () => {
  const rawToken = generateVerificationToken();
  return {
    rawToken,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
  };
};

// ============================================================
// TOKEN STORAGE
// ============================================================

/**
 * Store a verification token hash and expiration on a user.
 * @param {string} userId - Mongoose user id
 * @param {string} tokenHash - SHA-256 hash of the raw token
 * @param {Date} expiresAt - Expiration date
 * @returns {Promise<Object>} - Updated user
 */
export const storeTokenOnUser = async (userId, tokenHash, expiresAt) => {
  return User.findByIdAndUpdate(
    userId,
    {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationLastSentAt: new Date()
    },
    { new: true }
  );
};

// ============================================================
// VERIFICATION FLOW
// ============================================================

/**
 * Verify an email using a raw token.
 * @param {string} rawToken - The raw token from the verification link
 * @returns {Promise<Object>} - { success, status, user }
 *   status: 'verified' | 'already_verified' | 'invalid' | 'expired'
 */
export const verifyEmailWithToken = async (rawToken) => {
  if (!rawToken) {
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] No token provided');
    }
    return { success: false, status: 'invalid' };
  }

  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] Token received, length:', rawToken.length);
  }

  const tokenHash = hashToken(rawToken);

  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] Computed hash prefix:', tokenHash.substring(0, 8));
  }

  // Find user by token hash. Do NOT reveal whether a token existed.
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash });

  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] User found:', !!user);
    if (user) {
      console.log('[VERIFY-EMAIL] User ID:', user._id);
      console.log('[VERIFY-EMAIL] User email:', user.email);
      console.log('[VERIFY-EMAIL] emailVerified:', user.emailVerified);
      console.log('[VERIFY-EMAIL] Stored hash prefix:', user.emailVerificationTokenHash ? user.emailVerificationTokenHash.substring(0, 8) : 'null');
      console.log('[VERIFY-EMAIL] Token expires at:', user.emailVerificationExpiresAt);
      console.log('[VERIFY-EMAIL] Current time:', new Date());
      console.log('[VERIFY-EMAIL] Is expired:', user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date());
    }
  }

  if (!user) {
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] No user found with this token hash');
    }
    return { success: false, status: 'invalid' };
  }

  // Already verified - return success (idempotent)
  if (user.emailVerified) {
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] User already verified');
    }
    return { success: true, status: 'already_verified', user };
  }

  // Check expiration
  if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] Token expired or missing expiry');
    }
    return { success: false, status: 'expired', user };
  }

  // Mark as verified and clear token fields (one-time use)
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null
    },
    { new: true }
  );

  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] User verified successfully');
  }

  return { success: true, status: 'verified', user: updatedUser };
};

// ============================================================
// RESEND FLOW
// ============================================================

/**
 * Resend a verification email to a user.
 * @param {Object} user - Prisma user object
 * @returns {Promise<Object>} - { success, status, message }
 *   status: 'already_verified' | 'rate_limited' | 'sent' | 'error'
 */
export const resendVerificationEmail = async (user) => {
  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] Resend verification requested for user:', user.email);
    console.log('[VERIFY-EMAIL] User ID:', user._id);
    console.log('[VERIFY-EMAIL] Current emailVerified:', user.emailVerified);
    console.log('[VERIFY-EMAIL] Current token hash prefix:', user.emailVerificationTokenHash ? user.emailVerificationTokenHash.substring(0, 8) : 'null');
  }

  // Already verified
  if (user.emailVerified) {
    if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
      console.log('[VERIFY-EMAIL] User already verified, skipping resend');
    }
    return {
      success: true,
      status: 'already_verified',
      message: 'Your email is already verified'
    };
  }

  // Rate limit: minimum 60 seconds between resend requests
  if (user.emailVerificationLastSentAt) {
    const elapsed = Date.now() - new Date(user.emailVerificationLastSentAt).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
        console.log('[VERIFY-EMAIL] Rate limited, remaining seconds:', remainingSeconds);
      }
      return {
        success: false,
        status: 'rate_limited',
        message: `Please wait ${remainingSeconds} seconds before requesting another email`,
        retryAfterSeconds: remainingSeconds
      };
    }
  }

  // Generate new token (invalidates previous token by overwriting the hash)
  const { rawToken, tokenHash, expiresAt } = createTokenRecord();

  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] New token generated');
    console.log('[VERIFY-EMAIL] New token hash prefix:', tokenHash.substring(0, 8));
    console.log('[VERIFY-EMAIL] New token expires at:', expiresAt);
  }

  // Store new token hash (previous token is automatically invalidated)
  await storeTokenOnUser(user._id, tokenHash, expiresAt);

  if (process.env.DEBUG_EMAIL_VERIFICATION === 'true') {
    console.log('[VERIFY-EMAIL] New token stored on user');
  }

  // Send verification email (non-blocking - never fail the request)
  sendVerificationEmail(user, rawToken).catch(error => {
    console.error('[VERIFICATION] Failed to send verification email:', error);
  });

  return {
    success: true,
    status: 'sent',
    message: 'Verification email sent'
  };
};

// ============================================================
// REGISTRATION FLOW HELPER
// ============================================================

/**
 * Generate and store a verification token, then send the email.
 * Used immediately after successful registration.
 * NEVER throws - registration must never fail because of email delivery.
 * @param {Object} user - Mongoose user object
 */
export const sendVerificationOnRegistration = async (user) => {
  try {
    if (process.env.DEBUG_REGISTRATION === 'true') {
      console.log('[DEBUG-REGISTER] Starting verification email send for user:', user.email);
    }
    const { rawToken, tokenHash, expiresAt } = createTokenRecord();
    if (process.env.DEBUG_REGISTRATION === 'true') {
      console.log('[DEBUG-REGISTER] Token generated, storing on user');
    }
    await storeTokenOnUser(user._id, tokenHash, expiresAt);
    if (process.env.DEBUG_REGISTRATION === 'true') {
      console.log('[DEBUG-REGISTER] Token stored, sending email');
    }
    await sendVerificationEmail(user, rawToken);
    if (process.env.DEBUG_REGISTRATION === 'true') {
      console.log('[DEBUG-REGISTER] Verification email sent successfully');
    }
  } catch (error) {
    // Log only - registration must never fail because of email delivery
    console.error('[VERIFICATION] Failed to send verification email during registration:', error);
  }
};

export default {
  generateVerificationToken,
  hashToken,
  createTokenRecord,
  storeTokenOnUser,
  verifyEmailWithToken,
  resendVerificationEmail,
  sendVerificationOnRegistration
};