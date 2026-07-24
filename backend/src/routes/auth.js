// backend/src/routes/auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwtSecret.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload, uploadFromBuffer } from '../utils/cloudinary.js';


const serializeUser = (user) => {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  obj.id = obj._id;
  return obj;
};

// ============================================================
// Register
// ============================================================
const router = express.Router();
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role, phone, location } = req.body;

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
    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      role: role || 'WORKER',
      phone: phone || '',
      location: location || ''
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = serializeUser(user);
    delete userData.password;

    res.status(201).json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// ============================================================
// Login
// ============================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
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
      { userId: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = serializeUser(user);
    delete userData.password;

    res.json({
      success: true,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ============================================================
// GET ALL USERS (Admin only)
// PHASE 0 SECURITY FIX (audit §3): this previously had no auth check
// at all and leaked every user's PII to anonymous callers.
// ============================================================
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Get ALL users - NO filters
    const users = await User.find({})
      .select('-password') // Don't send passwords
      .sort({ createdAt: -1 }); // Newest first

    console.log(`✅ Auth route: Found ${users.length} users`);
    
    res.json({
      success: true,
      count: users.length,
      users: users.map(serializeUser)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// ============================================================
// GET USER BY ID (Admin only)
// PHASE 0 SECURITY FIX (audit §3): this previously had no auth check.
// ============================================================
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// ============================================================
// Verify Token
// ============================================================
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: serializeUser(user)
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

// ============================================================
// Update Profile (generic — works for any authenticated user)
// Used by the legacy profile image migration to save profileImage
// to MongoDB without needing role-specific endpoints.
// ============================================================
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { profileImage } = req.body;

    // Only update profileImage — this endpoint is intentionally scoped
    // to prevent accidental overwrites of other user fields.
    if (profileImage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'profileImage is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profileImage },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// ============================================================
// Forgot Password
// ============================================================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // In production, send reset email here
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset email sent'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process request'
    });
  }
});

// ============================================================
// Reset Password
// ============================================================
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    // Verify token
    const decoded = jwt.verify(token, getJwtSecret());
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
});

// ============================================================
// Upload Profile Photo
// ============================================================
router.post(
  '/upload-photo',
  authenticate,
  upload.single('photo'),
  async (req, res) => {
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
        {
          new: true
        }
      ).select('-password');


      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }


      res.json({
        success: true,
        message: 'Photo uploaded successfully',
        user: serializeUser(user)
      });


    } catch (error) {

      console.error(
        'Upload photo error:',
        error
      );

      res.status(500).json({
        success: false,
        message: 'Upload failed',
        error: error.message
      });

    }

  }
);

// ============================================================
// Get User Settings
// ============================================================
router.get('/settings', authenticate, async (req, res) => {
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
});

// ============================================================
// Update User Settings
// ============================================================
router.put('/settings', authenticate, async (req, res) => {
  try {
    const settings = req.body.settings || req.body;
    
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

    res.json({
      success: true,
      message: 'Settings saved successfully',
      user: serializeUser(user)
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// ============================================================
// Change Password
// ============================================================
router.put('/change-password', authenticate, async (req, res) => {
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

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// ============================================================
// Delete Account
// ============================================================
router.delete('/account', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(req.userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});

// ============================================================
// Change Password (POST - legacy/via authStore)
// ============================================================
router.post('/change-password', authenticate, async (req, res) => {
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

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// ============================================================
// Export Router
// ============================================================
export default router;