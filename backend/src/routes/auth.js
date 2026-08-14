// backend/src/routes/auth.js
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { upload, uploadFromBuffer } from '../utils/cloudinary.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

const receiveProfilePhoto = (req, res, next) => {
  upload.single('photo')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ success: false, message: 'Profile photo must be 5 MB or smaller' });
    }
    return res.status(400).json({ success: false, message: 'Profile photo must be a valid JPEG, PNG, GIF, or WebP image' });
  });
};

// ============================================================
// Register - Delegates to controller
// ============================================================
router.post('/register', authController.register);

// ============================================================
// Login - Delegates to controller
// ============================================================
router.post('/login', authController.login);

// ============================================================
// GET ALL USERS (Admin only) - Delegates to controller
// PHASE 0 SECURITY FIX (audit §3): this previously had no auth check
// at all and leaked every user's PII to anonymous callers.
// ============================================================
router.get('/users', requireAdmin, authController.getAllUsers);

// ============================================================
// GET USER BY ID (Admin only) - Delegates to controller
// PHASE 0 SECURITY FIX (audit §3): this previously had no auth check.
// ============================================================
router.get('/users/:id', requireAdmin, authController.getUserById);

// ============================================================
// Verify Token - Delegates to controller
// ============================================================
router.get('/verify', authController.verifyToken);

// ============================================================
// Verify Email - Delegates to controller
// Public route - no auth required (user clicks link in email)
// ============================================================
router.get('/verify-email', authController.verifyEmail);

// ============================================================
// Resend Verification - Delegates to controller
// Authenticated only - rate limited to 60 seconds
// ============================================================
router.post('/resend-verification', authenticate, authController.resendVerification);

// ============================================================
// Update Profile (generic — works for any authenticated user)
// Delegates to controller
// Whitelisted fields only: fullName, phone, language, profileImage.
// Only fields present in the request body are updated, so partial
// updates (e.g. profileImage-only from the legacy migration) keep
// working while support staff can also save name/phone/language.
// ============================================================
router.put('/profile', authenticate, authController.updateProfile);

// ============================================================
// Update Preferred Currency (authenticated account preference only)
// ============================================================
router.patch(
  '/preferences/currency',
  authenticate,
  authController.updatePreferredCurrency
);

// ============================================================
// Forgot Password - Delegates to controller
// ============================================================
router.post('/forgot-password', authController.forgotPassword);

// ============================================================
// Reset Password - Delegates to controller
// ============================================================
router.post('/reset-password', authController.resetPassword);

// ============================================================
// Upload Profile Photo - Delegates to controller
// ============================================================
router.post(
  '/upload-photo',
  authenticate,
  receiveProfilePhoto,
  authController.uploadProfilePhoto
);

// ============================================================
// Get User Settings - Delegates to controller
// ============================================================
router.get('/settings', authenticate, authController.getSettings);

// ============================================================
// Update User Settings - Delegates to controller
// ============================================================
router.put('/settings', authenticate, authController.updateSettings);

// ============================================================
// Change Password - Delegates to controller
// ============================================================
router.put('/change-password', authenticate, authController.changePassword);

// ============================================================
// Delete Account - Delegates to controller
// ============================================================
router.delete('/account', authenticate, authController.deleteAccount);

// ============================================================
// Change Password (POST - legacy/via authStore)
// Delegates to controller
// ============================================================
router.post('/change-password', authenticate, authController.changePasswordPost);

// ============================================================
// Export Router
// ============================================================
export default router;
