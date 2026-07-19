// backend/src/routes/oauth.js
import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'homelyserv_secret_key_2026';

// ============================================================
// SOCIAL LOGIN - Google & Facebook
// ============================================================
router.post('/social-login', async (req, res) => {
  try {
    const { provider, providerId, email, fullName, avatar } = req.body;
    
    console.log(`🔑 Social login with ${provider}:`, { email, fullName });
    
    // Check if user exists in localStorage (since we're using localStorage for demo)
    let user = null;
    try {
      const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
      user = users.find(u => u.email === email);
    } catch (error) {
      console.error('Error reading users:', error);
    }
    
    if (!user) {
      // Create new user
      user = {
        id: `${provider}_${providerId || Date.now()}`,
        fullName: fullName || `${provider} User`,
        email: email || `${provider}_user@example.com`,
        password: `${provider}_oauth_${Date.now()}`,
        role: 'EMPLOYER',
        phone: '',
        location: '',
        bio: `Signed in with ${provider}`,
        profileImage: avatar || '',
        createdAt: new Date().toISOString(),
        isPremium: false,
        subscriptionActive: false,
        profileComplete: false
      };
      
      // Save user
      try {
        const users = JSON.parse(localStorage.getItem('homelyserv_users') || '[]');
        users.push(user);
        localStorage.setItem('homelyserv_users', JSON.stringify(users));
        console.log(`✅ New ${provider} user created:`, user.email);
      } catch (error) {
        console.error('Error saving user:', error);
      }
    } else {
      console.log(`✅ Existing ${provider} user found:`, user.email);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        fullName: user.fullName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage || '',
        isPremium: user.isPremium || false
      }
    });
    
  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Social login failed'
    });
  }
});

export default router;