// backend/src/routes/oauth.js
// Google OAuth server-side token verification
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { getJwtSecret } from '../config/jwtSecret.js';
import { enrichUserResponse } from '../utils/userResponse.js';
import { withRegistrationGeography } from '../services/registrationGeographyService.js';
import { captureRegistrationGeography } from '../services/registrationGeographyService.js';
import { getSupportedCountryByCode } from '../utils/supportedCountries.js';
import { resolveAccountDefaultCurrency } from '../utils/currencyMetadata.js';
import { isCanonicalWorkerJob } from '../constants/jobOptions.js';
import { validatePhone } from '../controllers/authController.js';

const router = express.Router();

const GOOGLE_CLIENT_ID = '165930731307-gsnppmt9p23ftdr8872kvf9ohr4p9ars.apps.googleusercontent.com';
const FACEBOOK_APP_ID = '1813816306257010';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
};

const SOCIAL_ONBOARDING_PURPOSE = 'social_onboarding';
const SOCIAL_ONBOARDING_EXPIRY = '15m';

const encryptOnboardingRegistrationIp = (registrationIp) => {
  if (!registrationIp) return null;
  const key = crypto.createHash('sha256').update(getJwtSecret()).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(registrationIp), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((value) => value.toString('base64url')).join('.');
};

const decryptOnboardingRegistrationIp = (encryptedRegistrationIp) => {
  if (!encryptedRegistrationIp) return null;
  const [ivValue, authTagValue, ciphertextValue] = String(encryptedRegistrationIp).split('.');
  if (!ivValue || !authTagValue || !ciphertextValue) throw new Error('Invalid onboarding registration context');
  const key = crypto.createHash('sha256').update(getJwtSecret()).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivValue, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
};

const normalizeSuggestedCountryCode = (countryCode) => {
  const normalized = String(countryCode || '').trim().toUpperCase();
  const repositoryCode = normalized === 'GB' ? 'UK' : normalized;
  return getSupportedCountryByCode(repositoryCode)?.code || null;
};

const serializeSocialUser = (user) => {
  const userData = user.toObject();
  delete userData.password;
  delete userData.registrationIp;
  delete userData.registrationCountryCode;
  delete userData.registrationCountryName;
  delete userData.registrationLocationCapturedAt;
  return enrichUserResponse(userData);
};

// POST /api/oauth/social-login
// Verifies the provider token server-side and returns a HomelyServ JWT
router.post('/social-login', async (req, res) => {
  const requestedProvider = req.body?.provider?.toLowerCase() || (req.body?.credential ? 'google' : null);

  try {
    const { provider, credential, accessToken } = req.body;
    const normalizedProvider = provider?.toLowerCase() || (credential ? 'google' : null);

    let email;
    let fullName;
    let profileImage;

    if (normalizedProvider === 'google') {
      if (!credential) {
        return res.status(400).json({
          success: false,
          message: 'Missing Google credential'
        });
      }

      // Verify the Google ID token
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email || !payload.name) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Google token payload'
        });
      }

      email = payload.email;
      fullName = payload.name;
      profileImage = payload.picture || null;
    } else if (normalizedProvider === 'facebook') {
      if (!accessToken) {
        return res.status(400).json({
          success: false,
          message: 'Missing Facebook access token'
        });
      }

      // Confirm that the token was issued for the HomelyServ Facebook app.
      const { data: facebookApp } = await axios.get('https://graph.facebook.com/v18.0/app', {
        params: { fields: 'id', access_token: accessToken }
      });

      if (String(facebookApp?.id) !== FACEBOOK_APP_ID) {
        return res.status(401).json({
          success: false,
          message: 'Invalid Facebook access token'
        });
      }

      // Derive identity only from Facebook's verified response.
      const { data: facebookProfile } = await axios.get('https://graph.facebook.com/v18.0/me', {
        params: { fields: 'id,name,email,picture', access_token: accessToken }
      });

      if (!facebookProfile?.id || !facebookProfile?.name) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Facebook token payload'
        });
      }

      if (!facebookProfile.email) {
        return res.status(400).json({
          success: false,
          message: 'Facebook account email is required'
        });
      }

      email = facebookProfile.email;
      fullName = facebookProfile.name;
      profileImage = facebookProfile.picture?.data?.url || null;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported social login provider'
      });
    }

    // Find existing user by email. Existing social users keep the exact
    // established login path; only brand-new Google users enter onboarding.
    let user = await User.findOne({ email });

    if (!user && normalizedProvider === 'google') {
      const registrationGeography = captureRegistrationGeography(req);
      const onboardingToken = jwt.sign(
        {
          purpose: SOCIAL_ONBOARDING_PURPOSE,
          provider: normalizedProvider,
          email,
          fullName,
          profileImage: profileImage || null,
          registrationIpCiphertext: encryptOnboardingRegistrationIp(registrationGeography.registrationIp),
          registrationCountryCode: registrationGeography.registrationCountryCode,
          registrationCountryName: registrationGeography.registrationCountryName,
          registrationLocationCapturedAt: registrationGeography.registrationLocationCapturedAt,
        },
        getJwtSecret(),
        { expiresIn: SOCIAL_ONBOARDING_EXPIRY }
      );

      return res.status(200).json({
        success: true,
        needsOnboarding: true,
        onboardingToken,
        user: { fullName, email, profileImage: profileImage || null },
        suggestedCountryCode: normalizeSuggestedCountryCode(registrationGeography.registrationCountryCode),
      });
    }

    if (!user) {
      // Create new user with random password (password is required by schema)
      const randomPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new User(withRegistrationGeography(req, {
        fullName,
        email,
        password: hashedPassword,
        role: 'WORKER',
        profileImage
      }));

      await user.save();
    }

    // Generate JWT token (same format as /auth/login)
    const token = jwt.sign(
      { userId: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user without password
    res.json({
      success: true,
      token,
      user: serializeSocialUser(user)
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(401).json({
      success: false,
      message: requestedProvider === 'google'
        ? 'Google authentication failed'
        : requestedProvider === 'facebook'
          ? 'Facebook authentication failed'
          : 'Social authentication failed'
    });
  }
});

// POST /api/oauth/social-onboarding/complete
// Completes a brand-new Google Worker's required profile before User creation.
router.post('/social-onboarding/complete', async (req, res) => {
  try {
    const { onboardingToken, role, countryCode, phone, desiredJob, hourlyRate, tutorSpecialization } = req.body || {};
    if (!onboardingToken) {
      return res.status(401).json({ success: false, message: 'Social onboarding token is required' });
    }

    let onboarding;
    try {
      onboarding = jwt.verify(onboardingToken, getJwtSecret());
    } catch {
      return res.status(401).json({ success: false, message: 'Social onboarding token is invalid or expired' });
    }

    if (onboarding?.purpose !== SOCIAL_ONBOARDING_PURPOSE || onboarding?.provider !== 'google') {
      return res.status(401).json({ success: false, message: 'Invalid social onboarding token' });
    }

    const existingUser = await User.findOne({ email: onboarding.email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'This account already exists. Please sign in.' });
    }

    const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
    if (!['EMPLOYER', 'WORKER'].includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Please select a valid account role' });
    }

    const matchedCountry = getSupportedCountryByCode(String(countryCode || ''));
    if (!matchedCountry) {
      return res.status(400).json({ success: false, message: 'Please select a valid supported country' });
    }

    const phoneError = validatePhone(phone);
    if (phoneError) return res.status(400).json({ success: false, message: phoneError });

    let normalizedDesiredJob = '';
    let normalizedHourlyRate = '';
    let normalizedTutorSpecialization = '';

    if (normalizedRole === 'WORKER') {
      if (!isCanonicalWorkerJob(desiredJob)) {
        return res.status(400).json({ success: false, message: 'Please select a valid job type' });
      }
      normalizedDesiredJob = desiredJob;

      const rate = Number(hourlyRate);
      if (!Number.isFinite(rate) || rate <= 0) {
        return res.status(400).json({ success: false, message: 'Hourly rate must be a positive number' });
      }
      normalizedHourlyRate = String(rate);

      if (normalizedDesiredJob === 'tutor') {
        normalizedTutorSpecialization = String(tutorSpecialization || '').trim();
        if (!normalizedTutorSpecialization || normalizedTutorSpecialization.length > 100) {
          return res.status(400).json({ success: false, message: 'Specialization is required for tutors and must be 100 characters or fewer' });
        }
      }
    }

    const user = new User({
      fullName: onboarding.fullName,
      email: onboarding.email,
      password: await bcrypt.hash(generateRandomPassword(), 10),
      role: normalizedRole,
      phone: String(phone).trim(),
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      ...(normalizedRole === 'WORKER' ? {
        desiredJob: normalizedDesiredJob,
        hourlyRate: normalizedHourlyRate,
        hourlyRateCurrency: resolveAccountDefaultCurrency({ countryCode: matchedCountry.code, countryName: matchedCountry.name }),
        ...(normalizedDesiredJob === 'tutor' ? { tutorSpecialization: normalizedTutorSpecialization } : {}),
      } : {}),
      profileImage: onboarding.profileImage || null,
      registrationIp: decryptOnboardingRegistrationIp(onboarding.registrationIpCiphertext),
      registrationCountryCode: onboarding.registrationCountryCode || null,
      registrationCountryName: onboarding.registrationCountryName || 'Unknown',
      registrationLocationCapturedAt: onboarding.registrationLocationCapturedAt || new Date(),
    });

    try {
      await user.save();
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ success: false, message: 'This account already exists. Please sign in.' });
      }
      throw error;
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    return res.status(201).json({ success: true, token, user: serializeSocialUser(user) });
  } catch (error) {
    console.error('Social onboarding completion error:', error);
    return res.status(500).json({ success: false, message: 'Social onboarding failed' });
  }
});

export default router;
