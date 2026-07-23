// ============================================================
// ⚠️  NOT WIRED UP - DO NOT MOUNT THIS ROUTE AS-IS  ⚠️
// PHASE 0 SECURITY NOTE (audit §2.3): this file is not imported by
// any route and cannot currently run in production. It is also
// currently broken (uses CommonJS `require` in an ES module project).
// It is left here only for reference and contains a KNOWN AUTH-BYPASS
// VULNERABILITY: verifyGoogleToken() below uses jwt.decode() instead
// of jwt.verify(), which does NOT check the token's signature,
// issuer, or audience. Anyone could forge a fake "Google credential"
// with any email and be logged in as that user with no proof of
// identity. Do not import/mount this file until it is rewritten to
// verify tokens server-side (e.g. with google-auth-library's
// OAuth2Client.verifyIdToken). See routes/oauth.js for the currently
// disabled, safe placeholder for social login.
// ============================================================
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Verify Google token and get user info
const verifyGoogleToken = async (credential) => {
  try {
    // In production, use google-auth-library to verify the token
    // For now, we'll decode the JWT (simplified)
    const decoded = jwt.decode(credential);
    return {
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      sub: decoded.sub
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw error;
  }
};

// Google login handler
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify the Google token
    const userInfo = await verifyGoogleToken(credential);

    // Check if user exists by email
    let user = await prisma.user.findUnique({
      where: { email: userInfo.email }
    });

    if (!user) {
      // Create new user
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          fullName: userInfo.name || userInfo.email.split('@')[0],
          password: hashedPassword,
          role: 'WORKER',
          isVerified: true,
        }
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      // PHASE 0 SECURITY FIX: no hardcoded fallback secret.
      // When this file is converted to ESM, use getJwtSecret() from config/jwtSecret.js instead.
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified,
        avatar: userInfo.picture
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = { googleLogin };