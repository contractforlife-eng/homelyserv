const prisma = require('../utils/prisma');
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
      process.env.JWT_SECRET || 'homelyserv_secret_key_2026',
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