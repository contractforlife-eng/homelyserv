// backend/src/services/passwordResetTokenService.js
// ============================================================
// PASSWORD RESET TOKEN SERVICE
// Reusable token generation for staff-initiated password resets
// ============================================================
import crypto from 'crypto';
import { sendPasswordResetEmail } from './emailService.js';

// Token configuration (matches forgot-password flow)
const PASSWORD_RESET_TOKEN_BYTES = 32; // 256 bits
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a cryptographically secure random raw token.
 * @returns {string} - URL-safe base64 token
 */
export const generatePasswordResetToken = () => {
  return crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
};

/**
 * Hash a raw token using SHA-256.
 * @param {string} rawToken - The raw token to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
export const hashPasswordResetToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

/**
 * Create a password reset token for a user and send the reset email.
 * This is the staff-initiated version of the forgot-password flow.
 *
 * @param {Object} options - Options
 * @param {Object} options.user - Mongoose User document
 * @param {string} options.actorRole - Role of staff initiating reset (ADMIN/SUPPORT)
 * @param {string} [options.reason] - Optional reason for the reset
 * @param {string} [options.clientUrl] - Override client URL (defaults to CLIENT_URL env var)
 * @returns {Promise<Object>} - Result with success status and token info
 */
export const createAndSendPasswordReset = async ({ user, actorRole, reason, clientUrl }) => {
  try {
    if (!user) {
      return { success: false, message: 'User not provided' };
    }

    // Generate secure reset token
    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    // Store token hash and expiry on the user
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    // Build reset URL
    const baseUrl = clientUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    // Send password reset email via Resend
    const emailResult = await sendPasswordResetEmail(user, rawToken);

    if (!emailResult.success) {
      // Clear the token if email failed to avoid leaving an unusable token
      user.passwordResetTokenHash = null;
      user.passwordResetExpiresAt = null;
      await user.save();

      return {
        success: false,
        message: 'Failed to send password reset email',
        error: emailResult.error,
      };
    }

    return {
      success: true,
      message: 'Password reset link sent successfully',
      email: user.email,
      resetUrl, // Returned for support email notification
    };
  } catch (error) {
    console.error('❌ Error creating password reset token:', error);
    return {
      success: false,
      message: 'Failed to create password reset token',
      error: error.message,
    };
  }
};

export default {
  generatePasswordResetToken,
  hashPasswordResetToken,
  createAndSendPasswordReset,
};