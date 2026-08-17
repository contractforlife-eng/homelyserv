// backend/src/routes/notifications.js
// ============================================================
// NOTIFICATION REST API
// All operations go through NotificationService.
// ============================================================
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from '../services/notificationService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

const ALLOWED_PLATFORMS = ['android'];
const ALLOWED_TOKEN_TYPES = ['fcm'];
const MAX_TOKEN_LENGTH = 4096;

function validateDeviceInput(body) {
  const { token, platform, tokenType, appVersion } = body;
  if (!token || typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return { error: 'Invalid token' };
  }
  if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
    return { error: 'Invalid platform' };
  }
  if (!tokenType || !ALLOWED_TOKEN_TYPES.includes(tokenType)) {
    return { error: 'Invalid token type' };
  }
  if (appVersion !== undefined && typeof appVersion !== 'string') {
    return { error: 'Invalid appVersion' };
  }
  return null;
}

// ============================================================
// POST /api/notifications/devices
// Register or update a push device for the authenticated user.
// ============================================================
router.post('/devices', async (req, res) => {
  try {
    const userId = String(req.userId);
    const validationError = validateDeviceInput(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError.error });
    }

    const { token, platform, tokenType, appVersion } = req.body;

    const device = await prisma.pushDevice.upsert({
      where: { token },
      update: {
        userId,
        platform,
        tokenType,
        appVersion: appVersion || null,
        lastUsedAt: new Date(),
        revokedAt: null,
        revokedReason: null,
      },
      create: {
        userId,
        platform,
        tokenType,
        token,
        appVersion: appVersion || null,
        lastUsedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      device: {
        id: device.id,
        platform: device.platform,
        tokenType: device.tokenType,
        appVersion: device.appVersion,
        lastUsedAt: device.lastUsedAt,
        createdAt: device.createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error registering push device:', error);
    return res.status(500).json({ success: false, message: 'Failed to register device' });
  }
});

// ============================================================
// POST /api/notifications/devices/revoke
// Revoke the current installation's token for the authenticated user.
// ============================================================
router.post('/devices/revoke', async (req, res) => {
  try {
    const userId = String(req.userId);
    const { token } = req.body;

    if (!token || typeof token !== 'string' || token.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    const device = await prisma.pushDevice.findUnique({
      where: { token },
      select: { id: true, userId: true, revokedAt: true },
    });

    if (!device) {
      return res.json({ success: true, message: 'Device not found or already removed' });
    }

    if (device.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (device.revokedAt) {
      return res.json({ success: true, message: 'Device already revoked' });
    }

    await prisma.pushDevice.update({
      where: { id: device.id },
      data: {
        revokedAt: new Date(),
        revokedReason: 'USER_LOGOUT',
      },
    });

    return res.json({ success: true, message: 'Device revoked' });
  } catch (error) {
    console.error('❌ Error revoking push device:', error);
    return res.status(500).json({ success: false, message: 'Failed to revoke device' });
  }
});

// ============================================================
// GET /api/notifications
// Get notifications for the authenticated user (paginated).
// ============================================================
router.get('/', async (req, res) => {
  try {
    const userId = String(req.userId);
    const { page = 1, limit = 50 } = req.query;

    const { notifications, total, unreadCount } = await getNotifications(userId, { page, limit });

    return res.json({
      success: true,
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('❌ Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ============================================================
// GET /api/notifications/unread-count
// Get unread notification count for the authenticated user.
// ============================================================
router.get('/unread-count', async (req, res) => {
  try {
    const userId = String(req.userId);
    const count = await getUnreadCount(userId);
    return res.json({ success: true, count });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

// ============================================================
// PUT /api/notifications/:id/read
// Mark a single notification as read.
// ============================================================
router.put('/:id/read', async (req, res) => {
  try {
    const userId = String(req.userId);
    const { id } = req.params;

    const result = await markAsRead(id, userId);
    if (!result || result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
});

// ============================================================
// PUT /api/notifications/read-all
// Mark all notifications as read for the authenticated user.
// ============================================================
router.put('/read-all', async (req, res) => {
  try {
    const userId = String(req.userId);
    await markAllAsRead(userId);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// ============================================================
// DELETE /api/notifications/:id
// Delete a single notification.
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const userId = String(req.userId);
    const { id } = req.params;

    const result = await deleteNotification(id, userId);
    if (!result || result.count === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// ============================================================
// DELETE /api/notifications
// Clear all notifications for the authenticated user.
// ============================================================
router.delete('/', async (req, res) => {
  try {
    const userId = String(req.userId);
    await clearAllNotifications(userId);
    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to clear notifications' });
  }
});

// ============================================================
// GET /api/notifications/settings
// Get notification settings for the authenticated user.
// ============================================================
router.get('/settings', async (req, res) => {
  try {
    const userId = String(req.userId);
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          userId,
          newMessage: true,
          hireResponse: true,
          complaintUpdate: true,
          paymentConfirmation: true,
          systemUpdate: false,
          promotional: false,
        },
      });
    }

    return res.json({ success: true, settings });
  } catch (error) {
    console.error('❌ Error fetching notification settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// ============================================================
// PUT /api/notifications/settings
// Update notification settings for the authenticated user.
// ============================================================
router.put('/settings', async (req, res) => {
  try {
    const userId = String(req.userId);
    const { settings } = req.body;

    const updated = await prisma.notificationSettings.upsert({
      where: { userId },
      update: settings,
      create: { userId, ...settings },
    });

    return res.json({ success: true, settings: updated });
  } catch (error) {
    console.error('❌ Error updating notification settings:', error);
    return res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

export default router;