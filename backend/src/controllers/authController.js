import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import prisma from '../lib/prisma.js';
import { getJwtSecret } from '../config/jwtSecret.js';
import { CloudinaryConfigurationError, uploadFromBuffer } from '../utils/cloudinary.js';
import { getSupportedCountryByCode } from '../utils/supportedCountries.js';
import { enrichUserResponse } from '../utils/userResponse.js';
import { sanitizeUserResponse } from '../utils/safeUserResponse.js';
import { withRegistrationGeography } from '../services/registrationGeographyService.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';
import {
  createOrReuseAccountDeletionRequest,
  serializeAccountDeletionRequest
} from '../services/accountDeletionRequestService.js';
import {
  isSupportedCurrency,
  normalizeCurrencyCode,
  resolveAccountDefaultCurrency
} from '../utils/currencyMetadata.js';
import { isCanonicalWorkerJob } from '../constants/jobOptions.js';
import { ROOT_ADMIN_EMAIL, createRootRecoveryTokenClaims, isRecoveryEmail, isRootRecoveryRequest, normalizeEmail } from '../security/rootAdmin.js';
import { sendWelcomeEmail, sendPasswordResetEmail, shouldSendOptionalEmail } from '../services/emailService.js';
import { ensureWorkerProfile } from '../services/workerProfileService.js';
import {
  verifyEmailWithToken,
  resendVerificationEmail,
  sendVerificationOnRegistration
} from '../services/verificationService.js';

// ============================================================
// PASSWORD RESET CONSTANTS
// ============================================================
const PASSWORD_RESET_TOKEN_BYTES = 32; // 256 bits
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_RESET_MIN_PASSWORD_LENGTH = 6;

// ============================================================
// PASSWORD RESET RATE LIMITING (in-memory)
// ============================================================
// Simple in-memory rate limiter for the forgot-password endpoint.
// Limits each IP to 5 requests per 15 minutes to prevent abuse.
const forgotPasswordAttempts = new Map();

const FORGOT_PASSWORD_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const FORGOT_PASSWORD_MAX_ATTEMPTS = 5;

const isForgotPasswordRateLimited = (ip) => {
  const now = Date.now();
  const record = forgotPasswordAttempts.get(ip);

  if (!record) {
    forgotPasswordAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return false;
  }

  // Reset window if expired
  if (now - record.firstAttemptAt > FORGOT_PASSWORD_WINDOW_MS) {
    forgotPasswordAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return false;
  }

  record.count += 1;
  if (record.count > FORGOT_PASSWORD_MAX_ATTEMPTS) {
    return true;
  }

  return false;
};

// ============================================================
// PASSWORD RESET TOKEN HELPERS
// ============================================================

/**
 * Generate a cryptographically secure random raw token.
 * @returns {string} - URL-safe base64 token
 */
const generatePasswordResetToken = () => {
  return crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
};

/**
 * Hash a raw token using SHA-256.
 * @param {string} rawToken - The raw token to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
const hashPasswordResetToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

// ============================================================
// REGISTER
// ============================================================
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,20}$/;

/**
 * Validate that a phone number is non-empty, trimmed, and
 * international-friendly. Returns an error message or null.
 */
export const validatePhone = (phone) => {
  if (phone === undefined || phone === null) {
    return 'Phone number is required';
  }
  const trimmed = String(phone).trim();
  if (!trimmed) {
    return 'Phone number is required';
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return 'Phone number must be 7-20 characters and may contain digits, spaces, dashes, parentheses, dots, and an optional leading +';
  }
  const digitCount = trimmed.replace(/\D/g, '').length;
  if (digitCount < 7) {
    return 'Phone number must contain at least 7 digits';
  }
  return null;
};

export const register = async (req, res) => {
  try {
    const { fullName, email, password, role, phone, countryCode, countryName, location, desiredJob, hourlyRate, tutorSpecialization } = req.body;

    // ----------------------------------------------------------
    // PHONE - required for all new email/password registrations
    // ----------------------------------------------------------
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({
        success: false,
        message: phoneError
      });
    }
    const trimmedPhone = String(phone).trim();

    // ----------------------------------------------------------
    // COUNTRY - required for all new email/password registrations
    // Validate against the supported country list. The countryName
    // is derived from the matched supported country, not trusted
    // from the client.
    // ----------------------------------------------------------
    if (!countryCode || !String(countryCode).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Country is required'
      });
    }

    const matchedCountry = getSupportedCountryByCode(String(countryCode));
    if (!matchedCountry) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid supported country'
      });
    }

    // ----------------------------------------------------------
    // WORKER-SPECIFIC: desiredJob + hourlyRate
    // Canonical validation applies only to new WORKER registrations.
    // EMPLOYER registrations skip these checks entirely.
    // ----------------------------------------------------------
    const normalizedRole = (role || 'WORKER').toUpperCase();
    if (!['WORKER', 'EMPLOYER'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Please select a valid account role' });
    }
    if (normalizeEmail(email) === ROOT_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'This email is reserved.' });
    }
    let canonicalDesiredJob = '';
    let normalizedHourlyRate = '';
    let normalizedTutorSpecialization = '';

    if (normalizedRole === 'WORKER') {
      if (!desiredJob || typeof desiredJob !== 'string' || !isCanonicalWorkerJob(desiredJob)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid job type'
        });
      }
      canonicalDesiredJob = desiredJob;

      if (canonicalDesiredJob === 'tutor') {
        const trimmedSpecialization = String(tutorSpecialization || '').trim();
        if (!trimmedSpecialization || trimmedSpecialization.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Specialization is required for tutors and must be 100 characters or fewer'
          });
        }
        normalizedTutorSpecialization = trimmedSpecialization;
      }

      const rateValue = hourlyRate;
      if (rateValue === undefined || rateValue === null || String(rateValue).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Please enter your hourly rate'
        });
      }

      const rate = Number(rateValue);
      if (!Number.isFinite(rate) || rate <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Hourly rate must be a positive number'
        });
      }
      normalizedHourlyRate = String(rate);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User(withRegistrationGeography(req, {
      fullName,
      email,
      password: hashedPassword,
      role: normalizedRole,
      phone: trimmedPhone,
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      location: location || '',
      ...(normalizedRole === 'WORKER' ? {
        desiredJob: canonicalDesiredJob,
        hourlyRate: normalizedHourlyRate,
        hourlyRateCurrency: resolveAccountDefaultCurrency({
          countryCode: matchedCountry.code,
          countryName: matchedCountry.name
        }),
        ...(canonicalDesiredJob === 'tutor' ? { tutorSpecialization: normalizedTutorSpecialization } : {})
      } : {})
    }));

    console.log('[DEBUG-REGISTER] User creation attempt:', { email: user.email, role: user.role });
    await user.save();
    console.log('[DEBUG-REGISTER] User created successfully:', { id: user._id, email: user.email, createdAt: user.createdAt });

    if (user.role === 'WORKER') {
      await ensureWorkerProfile(user);
    }

    // Send welcome email (non-blocking, fire-and-forget)
    // Email sending must never block registration or cause rollback
    const firstName = fullName.split(' ')[0]; // Extract first name
    const shouldSendWelcome = await shouldSendOptionalEmail(user._id);
    if (shouldSendWelcome) {
      sendWelcomeEmail({
        firstName,
        role: user.role,
        email: user.email,
        language: user.language
      }).catch(error => {
        // Log error but don't throw - registration must succeed
        console.error('[EMAIL] Failed to send welcome email during registration:', error);
      });
    }

    // Send verification email (non-blocking, fire-and-forget)
    // Registration must NEVER fail because of email delivery.
    // sendVerificationOnRegistration never throws - it logs errors only.
    sendVerificationOnRegistration(user);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;
    delete userData.registrationIp;
    delete userData.registrationCountryCode;
    delete userData.registrationCountryName;
    delete userData.registrationLocationCapturedAt;

    res.status(201).json({
      success: true,
      token,
      user: enrichUserResponse(userData)
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// ============================================================
// VERIFY EMAIL
// ============================================================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body || {};

    if (!token) {
      return res.status(400).json({
        success: false,
        reason: 'missing_token',
        message: 'Verification token is required'
      });
    }

    const result = await verifyEmailWithToken(token);

    if (!result.success) {
      // Generic failure - do not reveal whether the token existed
      if (result.status === 'expired') {
        return res.status(400).json({
          success: false,
          status: 'expired',
          reason: 'expired',
          message: 'This verification link has expired. Please request a new one.'
        });
      }
      return res.status(400).json({
        success: false,
        status: 'invalid',
        reason: 'invalid_or_superseded',
        message: 'This verification link is no longer valid. If your email is already verified, you can sign in. Otherwise request a new verification email.'
      });
    }

    // Success (verified or already_verified)
    const userData = sanitizeUserResponse(result.user.toObject());
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;

    return res.json({
      success: true,
      status: result.status,
      reason: result.status === 'already_verified' ? 'already_verified' : 'success',
      message: result.status === 'already_verified'
        ? 'Your email is already verified'
        : 'Email verified successfully',
      user: userData
    });

  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// Email links must never mutate verification state. Scanners and legacy GET
// callers receive only a safe instruction to use the explicit POST action.
export const verifyEmailGet = async (req, res) => res.status(405).json({
  success: false,
  status: 'use_post',
  reason: 'use_post',
  message: 'Open this page and select Verify my email to continue.'
});

// ============================================================
// RESEND VERIFICATION
// ============================================================
export const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const result = await resendVerificationEmail(user);

    if (result.status === 'already_verified') {
      return res.json({
        success: true,
        status: 'already_verified',
        message: 'Your email is already verified'
      });
    }

    if (result.status === 'rate_limited') {
      return res.status(429).json({
        success: false,
        status: 'rate_limited',
        message: result.message,
        retryAfterSeconds: result.retryAfterSeconds
      });
    }

    return res.json({
      success: true,
      status: 'sent',
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    });
  }
};

// ============================================================
// LOGIN
// ============================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedLoginEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedLoginEmail });

    // Recovery credentials are backend-only and never represented by a User
    // document or returned email. Missing/malformed configuration deliberately
    // produces the same generic authentication failure.
    if (isRecoveryEmail(email)) {
      const recoveryHash = process.env.ROOT_ADMIN_RECOVERY_PASSWORD_HASH;
      const recoveryMatches = Boolean(recoveryHash) && await bcrypt.compare(String(password || ''), recoveryHash).catch(() => false);
      if (recoveryMatches && user) {
        const token = jwt.sign(
          createRootRecoveryTokenClaims(user),
          getJwtSecret(),
          { expiresIn: '7d' }
        );

        return res.json({
          success: true,
          token,
          mustChangePassword: false,
          user: {
            id: String(user._id),
            fullName: 'Root Admin',
            role: 'ADMIN',
            authContext: 'ROOT_RECOVERY'
          }
        });
      }
    }

    // Find user
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;

    res.json({
      success: true,
      token,
      mustChangePassword: !!user.mustChangePassword,
      user: enrichUserResponse(userData)
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// ============================================================
// GET CURRENT USER
// ============================================================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      user: enrichUserResponse(userData)
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================================
// UPDATE PROFILE
// ============================================================
export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, language, profileImage } = req.body;
    const userId = req.userId;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;
    if (language !== undefined) updates.language = language;
    if (profileImage !== undefined) updates.profileImage = profileImage;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updatable fields provided'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      user: enrichUserResponse(userData)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// ============================================================
// UPDATE PREFERRED CURRENCY
// Account-level default preference only; no financial records are changed.
// ============================================================
export const updatePreferredCurrency = async (req, res) => {
  try {
    const body = req.body || {};

    if (!Object.prototype.hasOwnProperty.call(body, 'preferredCurrency')) {
      return res.status(400).json({
        success: false,
        message: 'preferredCurrency is required'
      });
    }

    const input = body.preferredCurrency;
    let preferredCurrency = null;

    if (input !== null) {
      if (typeof input !== 'string' || input.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'preferredCurrency must be a supported currency code or null'
        });
      }

      preferredCurrency = normalizeCurrencyCode(input);
      if (!preferredCurrency || !isSupportedCurrency(preferredCurrency)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported preferred currency'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { preferredCurrency } },
      { new: true, runValidators: true }
    ).select('preferredCurrency countryCode countryName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const account = user.toObject();
    return res.json({
      success: true,
      preferredCurrency: account.preferredCurrency ?? null,
      effectiveCurrency: resolveAccountDefaultCurrency(account)
    });
  } catch (error) {
    console.error('Update preferred currency error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update preferred currency'
    });
  }
};

// ============================================================
// GET ALL USERS (Admin only)
// ============================================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    const activePremiumIds = await getActivePremiumUserIds(users.map((user) => String(user._id)));

    console.log(`✅ Auth controller: Found ${users.length} users`);

    res.json({
      success: true,
      count: users.length,
      users: users.map(user => {
        const userObj = sanitizeUserResponse(user.toObject());
        userObj.id = userObj._id;
        userObj.isPremium = ['EMPLOYER', 'WORKER'].includes(userObj.role)
          && activePremiumIds.has(String(userObj.id));
        delete userObj._id;
        return userObj;
      })
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// ============================================================
// GET USER BY ID (Admin only)
// ============================================================
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    const activePremiumIds = await getActivePremiumUserIds([String(userData.id)]);
    userData.isPremium = ['EMPLOYER', 'WORKER'].includes(userData.role)
      && activePremiumIds.has(String(userData.id));
    delete userData._id;

    res.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// ============================================================
// VERIFY TOKEN
// ============================================================
export const verifyToken = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. Please log in again.'
      });
    }

    // The authenticate middleware has already verified the JWT, checked the
    // user exists, and enforced the canonical tokenVersion policy.
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData._id;

    if (isRootRecoveryRequest(req)) {
      return res.json({
        success: true,
        user: {
          id: String(user._id),
          fullName: 'Root Admin',
          role: 'ADMIN',
          authContext: 'ROOT_RECOVERY'
        }
      });
    }

    res.json({
      success: true,
      user: enrichUserResponse(userData)
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// ============================================================
// FORGOT PASSWORD
// ============================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Rate limiting: prevent abuse
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    if (isForgotPasswordRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.'
      });
    }

    // Generic response for both existing and non-existing emails
    // to prevent account enumeration.
    const genericMessage = 'If an account exists for this email, a password reset link has been sent.';

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return the same generic response whether or not the user exists
    if (!user) {
      console.log('[FORGOT-PASSWORD] No user found for email lookup');
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    console.log('[FORGOT-PASSWORD] User found:', user.email);

    // Generate secure reset token
    const rawToken = generatePasswordResetToken();
    const tokenHash = hashPasswordResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    // Store token hash and expiry on the user
    user.passwordResetTokenHash = tokenHash;
    user.passwordResetExpiresAt = expiresAt;
    await user.save();

    console.log('[FORGOT-PASSWORD] Reset token hash stored');
    console.log('[FORGOT-PASSWORD] Reset expiry stored:', expiresAt.toISOString());

    // Send password reset email via Resend
    const emailResult = await sendPasswordResetEmail(user, rawToken);

    if (!emailResult.success) {
      console.error('[FORGOT-PASSWORD] Email send failed:', emailResult.error);
      // Still return success to prevent account enumeration
      return res.json({
        success: true,
        message: genericMessage
      });
    }

    console.log('[FORGOT-PASSWORD] Password reset email sent successfully');
    console.log('[FORGOT-PASSWORD] Message ID:', emailResult.messageId);

    res.json({
      success: true,
      message: genericMessage
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
};

// ============================================================
// RESET PASSWORD
// ============================================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    if (!newPassword || newPassword.length < PASSWORD_RESET_MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${PASSWORD_RESET_MIN_PASSWORD_LENGTH} characters`
      });
    }

    // Hash the incoming raw token using the same algorithm used during creation
    const tokenHash = hashPasswordResetToken(token);

    // Find user by reset token hash
    const user = await User.findOne({ passwordResetTokenHash: tokenHash });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link is invalid or has already been used.'
      });
    }

    // Check token expiration
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'This password reset link has expired. Please request a new one.'
      });
    }

    // Hash new password using existing bcrypt policy (10 rounds)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields (single-use token)
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.passwordResetAt = new Date();
    user.mustChangePassword = false;

    await user.save();

    console.log('[RESET-PASSWORD] Password reset successful for user:', user.email);

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// ============================================================
// UPLOAD PROFILE PHOTO
// ============================================================
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded'
      });
    }

    const uploaded = await uploadFromBuffer(req.file.buffer, {
      folder: 'homelyserv',
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    });

    const imageUrl = uploaded.secure_url;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      user: enrichUserResponse(userData)
    });

  } catch (error) {
    const configurationFailure = error instanceof CloudinaryConfigurationError || error?.code === 'CLOUDINARY_NOT_CONFIGURED';
    console.error('Upload photo error:', { name: error?.name, code: error?.code, httpCode: error?.http_code });
    res.status(configurationFailure ? 503 : 502).json({
      success: false,
      message: configurationFailure
        ? 'Profile photo upload is temporarily unavailable because storage is not configured'
        : 'Profile photo provider could not complete the upload. Please try again.'
    });
  }
};

// ============================================================
// GET USER SETTINGS
// ============================================================
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('settings');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      settings: user.settings || {}
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get settings'
    });
  }
};

// ============================================================
// UPDATE USER SETTINGS
// ============================================================
export const updateSettings = async (req, res) => {
  try {
    const settings = req.body.settings || req.body;

    const previousUser = await User.findById(req.userId).select('settings');
    const previousSettings = previousUser?.settings || {};

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { settings: settings } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData._id;

    if (req.userRole === 'WORKER' && typeof settings.availableForHire === 'boolean') {
      try {
        const availability = settings.availableForHire === true ? 'available' : 'unavailable';
        const workerProfile = await prisma.workerProfile.findUnique({
          where: { userId: String(req.userId) },
          select: { id: true }
        });

        if (!workerProfile) {
          await rollbackUserSettings(req.userId, previousSettings);
          return res.status(500).json({
            success: false,
            message: 'Worker profile not found — availability could not be synced'
          });
        }

        await prisma.workerProfile.update({
          where: { userId: String(req.userId) },
          data: { availability }
        });
      } catch (syncError) {
        console.error('Availability sync error:', syncError);
        try {
          await rollbackUserSettings(req.userId, previousSettings);
        } catch (rollbackError) {
          console.error('Availability rollback error:', rollbackError);
          return res.status(500).json({
            success: false,
            message: 'Failed to sync availability and rollback settings'
          });
        }
        return res.status(500).json({
          success: false,
          message: 'Failed to sync availability'
        });
      }
    }

    res.json({
      success: true,
      message: 'Settings saved successfully',
      user: enrichUserResponse(userData)
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

const rollbackUserSettings = async (userId, previousSettings) => {
  const attempt = async () => User.findByIdAndUpdate(
    userId,
    { $set: { settings: previousSettings } },
    { new: true }
  );

  try {
    await attempt();
  } catch (firstError) {
    console.error('Availability rollback first attempt failed:', firstError);
    try {
      await attempt();
    } catch (secondError) {
      console.error('Availability rollback second attempt failed:', secondError);
      throw new Error(`Rollback failed after 2 attempts: first=${firstError.message}, second=${secondError.message}`);
    }
  }
};

// ============================================================
// CHANGE PASSWORD
// ============================================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// ============================================================
// DELETE ACCOUNT
// ============================================================
export const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (normalizeEmail(user.email) === ROOT_ADMIN_EMAIL) {
      return res.status(403).json({ success: false, message: 'The Root Admin account is protected.' });
    }

    const { request, reused } = await createOrReuseAccountDeletionRequest(req.userId);

    res.status(reused ? 200 : 202).json({
      success: true,
      requestAccepted: true,
      reused,
      message: 'Account deletion request accepted. You will be signed out.',
      deletionRequest: serializeAccountDeletionRequest(request)
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
};

// ============================================================
// CHANGE PASSWORD (POST - legacy/via authStore)
// ============================================================
export const changePasswordPost = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustChangePassword = false;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};
