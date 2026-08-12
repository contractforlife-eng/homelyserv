// backend/src/routes/oauth.js
// Google OAuth server-side token verification
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { getJwtSecret } from '../config/jwtSecret.js';

const router = express.Router();

const GOOGLE_CLIENT_ID = '165930731307-gsnppmt9p23ftdr8872kvf9ohr4p9ars.apps.googleusercontent.com';
const FACEBOOK_APP_ID = '1813816306257010';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
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

    // Find existing user by email
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user with random password (password is required by schema)
      const randomPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = new User({
        fullName,
        email,
        password: hashedPassword,
        role: 'WORKER',
        profileImage
      });

      await user.save();
    }

    // Generate JWT token (same format as /auth/login)
    const token = jwt.sign(
      { userId: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user without password
    const userData = user.toObject();
    delete userData.password;

    res.json({
      success: true,
      token,
      user: userData
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

export default router;
