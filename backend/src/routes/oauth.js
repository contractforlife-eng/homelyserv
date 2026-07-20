// backend/src/routes/oauth.js
// Google OAuth server-side token verification
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';

const router = express.Router();

const GOOGLE_CLIENT_ID = '165930731307-gsnppmt9p23ftdr8872kvf9ohr4p9ars.apps.googleusercontent.com';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
};

// POST /api/oauth/social-login
// Verifies Google ID token server-side and returns a HomelyServ JWT
router.post('/social-login', async (req, res) => {
  try {
    const { credential } = req.body;

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

    const email = payload.email;
    const fullName = payload.name;
    const profileImage = payload.picture || null;

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
      { userId: user._id, role: user.role },
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
    console.error('Google social login error:', error);
    res.status(401).json({
      success: false,
      message: 'Google authentication failed'
    });
  }
});

export default router;