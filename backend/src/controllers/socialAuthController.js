// ============================================================
// ⚠️  NOT WIRED UP - DO NOT MOUNT THIS ROUTE AS-IS  ⚠️
// PHASE 0 SECURITY NOTE (audit §2.3): this file is not imported by
// any route and cannot currently run in production. It is also
// currently broken (uses CommonJS `require` in an ES module project).
// It accepts `provider`/`providerId`/`email`/`fullName` directly from
// the request body with NO verification that the caller actually
// authenticated with that provider, then signs a real session token
// for that identity - the same class of auth-bypass bug as
// googleAuthController.js. Do not import/mount this file until it
// verifies the provider token server-side. See routes/oauth.js for
// the currently disabled, safe placeholder for social login.
// ============================================================
const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate a random password for social users
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
};

// Generic social login handler
const socialLogin = async (req, res) => {
  try {
    const { provider, providerId, email, fullName, avatar } = req.body;

    // Validate required fields
    if (!provider || !providerId || !email) {
      return res.status(400).json({ message: 'Missing required social login data' });
    }

    console.log(`Social login attempt: ${provider} - ${email}`);

    // Check if user exists by email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user
      const randomPassword = generateRandomPassword();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await prisma.user.create({
        data: {
          email,
          fullName: fullName || 'User',
          password: hashedPassword,
          role: 'WORKER',
          isVerified: true,
        }
      });

      console.log(`New user created via ${provider}: ${email}`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'homelyserv_secret_key_2026',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = { socialLogin };