import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileWallNotifications, wallNotificationPayload } from './wallNotificationService.js';
import { WallEntry, WallContent } from '../models/Wall.js';
import User from '../models/User.js';

test('reconcileWallNotifications creates persistent in-app notifications and hands off correctly', async () => {
  const origWallEntryFind = WallEntry.find;
  const origWallContentFind = WallContent.find;
  const origWallEntryUpdateOne = WallEntry.updateOne;
  const origWallContentUpdateOne = WallContent.updateOne;
  const origUserFindById = User.findById;

  const mockEntries = [
    {
      _id: 'gift_entry_001',
      type: 'GIFT',
      userId: 'sender_123',
      recipientId: 'recipient_456',
      postId: 'post_789',
      giftId: 'rose',
      giftEmoji: '🌹',
      notificationHandedOff: false,
    },
    {
      _id: 'gift_entry_self',
      type: 'GIFT',
      userId: 'sender_123',
      recipientId: 'sender_123', // Self-gift corner case
      postId: 'post_789',
      giftId: 'rose',
      giftEmoji: '🌹',
      notificationHandedOff: false,
    }
  ];

  const updatedHandedOff = new Set();
  const createdNotifications = [];

  WallEntry.find = () => ({
    sort: () => ({
      limit: () => ({
        lean: async () => mockEntries,
      }),
    }),
  });

  WallContent.find = () => ({
    sort: () => ({
      limit: () => ({
        lean: async () => [],
      }),
    }),
  });

  WallEntry.updateOne = async (filter, update) => {
    if (update.$set?.notificationHandedOff) {
      updatedHandedOff.add(filter._id);
    }
    return { modifiedCount: 1 };
  };

  User.findById = (id) => ({
    select: () => ({
      lean: async () => {
        if (id === 'sender_123') return { fullName: 'Sender Person' };
        if (id === 'recipient_456') return { language: 'ar' };
        return null;
      },
    }),
  });

  const mockCreateNotification = async (userId, payload) => {
    createdNotifications.push({ userId, payload });
    return {
      id: 'notif_' + payload.eventKey,
      userId,
      ...payload,
      isRead: false,
      createdAt: new Date(),
    };
  };

  try {
    await reconcileWallNotifications({ createNotification: mockCreateNotification });

    // Verification:
    // 1. Recipient receives the notification, isolated to recipient_456
    assert.equal(createdNotifications.length, 1);
    const notif = createdNotifications[0];
    assert.equal(notif.userId, 'recipient_456');
    assert.equal(notif.payload.type, 'WALL_GIFT');
    assert.equal(notif.payload.icon, '🌹');
    assert.equal(notif.payload.link, '/wall?post=post_789');
    assert.equal(notif.payload.eventKey, 'wall:gift:gift_entry_001');
    assert.equal(notif.payload.message, 'Sender Person أرسل لك هدية');

    // 2. Both entries marked as handed off (the valid gift after notification creation, and the self gift marked without notifying)
    assert.ok(updatedHandedOff.has('gift_entry_001'));
    assert.ok(updatedHandedOff.has('gift_entry_self'));

    // 3. Deduplication check: if ran again with no unhanded items, nothing new created
    mockEntries.length = 0;
    await reconcileWallNotifications({ createNotification: mockCreateNotification });
    assert.equal(createdNotifications.length, 1);
  } finally {
    WallEntry.find = origWallEntryFind;
    WallContent.find = origWallContentFind;
    WallEntry.updateOne = origWallEntryUpdateOne;
    WallContent.updateOne = origWallContentUpdateOne;
    User.findById = origUserFindById;
  }
});
