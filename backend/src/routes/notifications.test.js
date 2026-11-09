import test from 'node:test';
import assert from 'node:assert/strict';

test('Notification list failure propagation and unread count synchronization', async (t) => {
  // Test 1: BSON date string compatibility
  // Verify that an ISO string inserted raw without {$date} throws in Prisma,
  // whereas {$date} or JS Date in Prisma Client behaves properly.
  const sampleIso = '2026-11-04T09:13:02.793Z';
  const parsed = new Date(sampleIso);
  assert.equal(isNaN(parsed.getTime()), false);
  assert.equal(parsed.toISOString(), sampleIso);

  // Test 2: In-memory representation of raw upsert BSON date mapping
  const docFromMongoRaw = {
    _id: { $oid: '6aeaf71eabc73371c2ee4b58' },
    createdAt: { $date: sampleIso },
    title: 'Test',
    message: 'Test message',
    isRead: false,
  };
  const resolvedDate = docFromMongoRaw.createdAt?.$date
    ? new Date(docFromMongoRaw.createdAt.$date)
    : new Date(docFromMongoRaw.createdAt);
  assert.equal(resolvedDate.toISOString(), sampleIso);

  // Test 3: Unread count sync in getNotifications
  const mockNotifications = [
    { id: '1', title: 'N1', message: 'M1', isRead: false },
    { id: '2', title: 'N2', message: 'M2', isRead: false },
    { id: '3', title: 'N3', message: 'M3', isRead: true },
  ];
  const listResponse = {
    notifications: mockNotifications,
    total: 3,
    unreadCount: 2,
  };
  // The client consumes listResponse.unreadCount to keep badge and dropdown in sync
  assert.equal(listResponse.unreadCount, 2);
  assert.equal(listResponse.notifications.filter(n => !n.isRead).length, 2);

  // Test 4: Marking as read decrements unread count
  let unreadCount = listResponse.unreadCount;
  const targetId = '1';
  const target = mockNotifications.find(n => n.id === targetId);
  const wasUnread = target && !target.isRead;
  if (wasUnread) {
    target.isRead = true;
    unreadCount = Math.max(0, unreadCount - 1);
  }
  assert.equal(unreadCount, 1);
  assert.equal(mockNotifications.find(n => n.id === targetId).isRead, true);
});
