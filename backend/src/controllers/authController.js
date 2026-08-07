import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret } from '../config/jwtSecret.js';
import { sendWelcomeEmail } from '../services/emailService.js';
import {
  verifyEmailWithToken,
  resendVerificationEmail,
  sendVerificationOnRegistration
} from '../services/verificationService.js';

// ============================================================
// REGISTER
// ============================================================
export const register = async (req, res) => {
  console.log('📝 Registration request received:', req.body);
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

    // Send welcome email (non-blocking, fire-and-forget)
    // Email sending must never block registration or cause rollback
    const firstName = fullName.split(' ')[0]; // Extract first name
    sendWelcomeEmail({
      firstName,
      role: user.role,
      email: user.email,
      language: user.language
    }).catch(error => {
      // Log error but don't throw - registration must succeed
      console.error('[EMAIL] Failed to send welcome email during registration:', error);
    });

    // Send verification email (non-blocking, fire-and-forget)
    // Registration must NEVER fail because of email delivery.
    // sendVerificationOnRegistration never throws - it logs errors only.
    sendVerificationOnRegistration(user);

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = user.toObject();
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;

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
};

// ============================================================
// VERIFY EMAIL
// ============================================================
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
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
          message: 'This verification link has expired. Please request a new one.'
        });
      }
      return res.status(400).json({
        success: false,
        status: 'invalid',
        message: 'Verification failed. The link is invalid or has already been used.'
      });
    }

    // Success (verified or already_verified)
    const userData = result.user.toObject();
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;

    return res.json({
      success: true,
      status: result.status,
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
  console.log('📝 Login request received:', req.body.email);
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
    const userData = user.toObject();
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;

    res.json({
      success: true,
      token,
      mustChangePassword: !!user.mustChangePassword,
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
    
    const userData = user.toObject();
    userData.id = userData._id;
    delete userData._id;
    
    res.json({
      success: true,
      user: userData
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

    const userData = user.toObject();
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      user: userData
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
// GET ALL USERS (Admin only)
// ============================================================
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    console.log(`✅ Auth controller: Found ${users.length} users`);
    
    res.json({
      success: true,
      count: users.length,
      users: users.map(user => {
        const userObj = user.toObject();
        userObj.id = userObj._id;
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

    const userData = user.toObject();
    userData.id = userData._id;
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

    const userData = user.toObject();
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      user: userData
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
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // In production, send reset email here
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
};

// ============================================================
// RESET PASSWORD
// ============================================================
export const resetPassword = async (req, res) => {
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

    const userData = user.toObject();
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      message: 'Photo uploaded successfully',
      user: userData
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
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

    const userData = user.toObject();
    userData.id = userData._id;
    delete userData._id;

    res.json({
      success: true,
      message: 'Settings saved successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
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