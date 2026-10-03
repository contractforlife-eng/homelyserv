// backend/src/controllers/studentFriendshipController.js
// ============================================================
// STUDENT FRIENDSHIP & CLASSMATE DISCOVERY CONTROLLER
//
// Endpoints:
// - GET  /api/students/classmates       - Search/list eligible classmates & friendship statuses
// - POST /api/students/friends/request  - Send a friend request to an eligible classmate
// - GET  /api/students/friends          - List accepted friends and pending requests
// - POST /api/students/friends/:id/accept - Accept an incoming pending request
// - POST /api/students/friends/:id/reject - Reject an incoming pending request
//
// STRICT SECURITY RULES:
// 1. All routes guarded by requireStudent (req.userId).
// 2. Classmate discovery is restricted strictly to verified group lesson peers.
// 3. New requests can only be sent to eligible classmates.
// 4. Reverse pending requests are safely reconciled:
//    If B already requested A (PENDING), A sending a request to B will accept it.
// 5. Duplicate requests or duplicate relationships are rejected.
// 6. Only the recipient may accept or reject a pending request.
// 7. No chat creation or Message/Conversation mutation in this phase.
// ============================================================
import StudentFriendship from '../models/StudentFriendship.js';
import User from '../models/User.js';
import { getEligibleClassmates, isEligibleClassmate } from '../services/studentClassmateService.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * GET /api/students/classmates
 * Returns eligible classmates for the authenticated student, filtered by optional search query,
 * along with current friendship status if any exists.
 */
export const searchClassmates = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { q, limit = 50, page = 1 } = req.query || {};

    const eligibleClassmates = await getEligibleClassmates(studentUserId);
    if (eligibleClassmates.length === 0) {
      return res.json({
        success: true,
        count: 0,
        classmates: []
      });
    }

    // Filter by search query if provided
    let filtered = eligibleClassmates;
    if (q && typeof q === 'string' && q.trim()) {
      const searchLower = q.trim().toLowerCase();
      filtered = eligibleClassmates.filter((c) =>
        (c.fullName || '').toLowerCase().includes(searchLower) ||
        c.sharedGroups.some((g) =>
          (g.name || '').toLowerCase().includes(searchLower) ||
          (g.subject || '').toLowerCase().includes(searchLower)
        )
      );
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    // Fetch existing friendship records with these classmates
    const classmateUserIds = paginated.map((c) => c.userId);
    const friendships = await StudentFriendship.find({
      $or: [
        { requesterUserId: studentUserId, recipientUserId: { $in: classmateUserIds } },
        { recipientUserId: studentUserId, requesterUserId: { $in: classmateUserIds } }
      ]
    }).lean();

    const friendshipMap = new Map();
    for (const f of friendships) {
      const peerId = String(f.requesterUserId) === String(studentUserId)
        ? String(f.recipientUserId)
        : String(f.requesterUserId);
      friendshipMap.set(peerId, {
        id: String(f._id),
        status: f.status,
        isRequester: String(f.requesterUserId) === String(studentUserId),
        createdAt: f.createdAt
      });
    }

    const dtoList = paginated.map((c) => ({
      userId: c.userId,
      fullName: c.fullName,
      profileImage: c.profileImage,
      sharedGroups: c.sharedGroups,
      friendship: friendshipMap.get(String(c.userId)) || null
    }));

    return res.json({
      success: true,
      count: filtered.length,
      page: pageNum,
      classmates: dtoList
    });
  } catch (error) {
    console.error('Error searching student classmates:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving classmates',
      error: error.message
    });
  }
};

/**
 * POST /api/students/friends/request
 * Send a friend request to an eligible classmate.
 */
export const sendFriendRequest = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { recipientUserId } = req.body || {};

    if (!isValidObjectId(String(recipientUserId || ''))) {
      return res.status(400).json({ success: false, message: 'Valid recipient user ID is required' });
    }

    if (String(studentUserId) === String(recipientUserId)) {
      return res.status(400).json({ success: false, message: 'Cannot send a friend request to yourself' });
    }

    // 1. Verify recipient exists and is a STUDENT
    const recipientUser = await User.findOne({
      _id: recipientUserId,
      role: 'STUDENT',
      isSuspended: false
    }).select('_id fullName');

    if (!recipientUser) {
      return res.status(404).json({ success: false, message: 'Student user not found' });
    }

    // 2. Verify recipient is currently an eligible classmate
    const eligible = await isEligibleClassmate(studentUserId, recipientUserId);
    if (!eligible) {
      return res.status(403).json({
        success: false,
        message: 'You can only send friend requests to students who share a class with you'
      });
    }

    // 3. Check for existing friendship record between this pair in either direction
    const existing = await StudentFriendship.findOne({
      $or: [
        { requesterUserId: studentUserId, recipientUserId },
        { requesterUserId: recipientUserId, recipientUserId: studentUserId }
      ]
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return res.status(400).json({ success: false, message: 'You are already friends with this student' });
      }
      if (existing.status === 'BLOCKED') {
        return res.status(403).json({ success: false, message: 'Cannot connect with this student' });
      }

      // If the other user already sent a pending request to me, automatically accept it!
      if (existing.status === 'PENDING' && String(existing.requesterUserId) === String(recipientUserId)) {
        existing.status = 'ACCEPTED';
        existing.respondedAt = new Date();
        await existing.save();

        return res.json({
          success: true,
          message: 'Friend request accepted',
          friendship: {
            id: String(existing._id),
            status: existing.status,
            requesterUserId: String(existing.requesterUserId),
            recipientUserId: String(existing.recipientUserId),
            createdAt: existing.createdAt
          }
        });
      }

      if (existing.status === 'PENDING' && String(existing.requesterUserId) === String(studentUserId)) {
        return res.status(400).json({ success: false, message: 'Friend request already sent and pending' });
      }

      // If previous status was REJECTED, reset to PENDING with current user as requester
      if (existing.status === 'REJECTED') {
        existing.requesterUserId = studentUserId;
        existing.recipientUserId = recipientUserId;
        existing.status = 'PENDING';
        existing.respondedAt = null;
        await existing.save();

        // Dispatch non-blocking notification
        try {
          const senderUser = await User.findById(studentUserId).select('fullName');
          createNotification(String(recipientUserId), {
            type: NOTIFICATION_TYPES.SYSTEM,
            title: 'New Friend Request',
            message: `${senderUser?.fullName || 'A student'} sent you a friend request.`,
            link: '/student-messages'
          }).catch(() => {});
        } catch (_) {}

        return res.status(201).json({
          success: true,
          message: 'Friend request sent',
          friendship: {
            id: String(existing._id),
            status: existing.status,
            requesterUserId: String(existing.requesterUserId),
            recipientUserId: String(existing.recipientUserId),
            createdAt: existing.createdAt
          }
        });
      }
    }

    // 4. Create new friendship record
    const newFriendship = await StudentFriendship.create({
      requesterUserId: studentUserId,
      recipientUserId
    });

    // Dispatch non-blocking notification
    try {
      const senderUser = await User.findById(studentUserId).select('fullName');
      createNotification(String(recipientUserId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'New Friend Request',
        message: `${senderUser?.fullName || 'A student'} sent you a friend request.`,
        link: '/student-messages'
      }).catch(() => {});
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'Friend request sent',
      friendship: {
        id: String(newFriendship._id),
        status: newFriendship.status,
        requesterUserId: String(newFriendship.requesterUserId),
        recipientUserId: String(newFriendship.recipientUserId),
        createdAt: newFriendship.createdAt
      }
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error sending friend request',
      error: error.message
    });
  }
};

/**
 * GET /api/students/friends
 * Returns all accepted friends, incoming pending requests, and outgoing pending requests
 * for the authenticated student.
 */
export const getStudentFriends = async (req, res) => {
  try {
    const studentUserId = req.userId;

    const allRecords = await StudentFriendship.find({
      $or: [{ requesterUserId: studentUserId }, { recipientUserId: studentUserId }]
    }).sort({ updatedAt: -1 }).lean();

    // Collect peer IDs for batch fetching
    const peerUserIds = [
      ...new Set(
        allRecords.map((r) =>
          String(r.requesterUserId) === String(studentUserId)
            ? String(r.recipientUserId)
            : String(r.requesterUserId)
        )
      )
    ];

    const peerUsers = await User.find({
      _id: { $in: peerUserIds }
    }).select('_id fullName profileImage email').lean();

    const userMap = new Map(peerUsers.map((u) => [String(u._id), u]));

    const friends = [];
    const incomingRequests = [];
    const outgoingRequests = [];

    for (const r of allRecords) {
      const isRequester = String(r.requesterUserId) === String(studentUserId);
      const peerId = isRequester ? String(r.recipientUserId) : String(r.requesterUserId);
      const peer = userMap.get(peerId);

      const item = {
        id: String(r._id),
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        peer: peer
          ? {
              id: String(peer._id),
              fullName: peer.fullName || 'Student',
              profileImage: peer.profileImage || null
            }
          : { id: peerId, fullName: 'Student', profileImage: null }
      };

      if (r.status === 'ACCEPTED') {
        friends.push(item);
      } else if (r.status === 'PENDING') {
        if (isRequester) {
          outgoingRequests.push(item);
        } else {
          incomingRequests.push(item);
        }
      }
    }

    return res.json({
      success: true,
      friends,
      incomingRequests,
      outgoingRequests
    });
  } catch (error) {
    console.error('Error fetching student friends:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving friends',
      error: error.message
    });
  }
};

/**
 * POST /api/students/friends/:id/accept
 * Accept an incoming pending friend request.
 */
export const acceptFriendRequest = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    const friendship = await StudentFriendship.findById(id);
    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Only the recipient may accept
    if (String(friendship.recipientUserId) !== String(studentUserId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to accept this request' });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status: ${friendship.status}`
      });
    }

    friendship.status = 'ACCEPTED';
    friendship.respondedAt = new Date();
    await friendship.save();

    // Dispatch non-blocking notification to requester
    try {
      const recipientUser = await User.findById(studentUserId).select('fullName');
      createNotification(String(friendship.requesterUserId), {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'Friend Request Accepted',
        message: `${recipientUser?.fullName || 'Your classmate'} accepted your friend request.`,
        link: '/student-messages'
      }).catch(() => {});
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Friend request accepted',
      friendship: {
        id: String(friendship._id),
        status: friendship.status,
        requesterUserId: String(friendship.requesterUserId),
        recipientUserId: String(friendship.recipientUserId),
        respondedAt: friendship.respondedAt
      }
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error accepting request',
      error: error.message
    });
  }
};

/**
 * POST /api/students/friends/:id/reject
 * Reject an incoming pending friend request.
 */
export const rejectFriendRequest = async (req, res) => {
  try {
    const studentUserId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(String(id || ''))) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    const friendship = await StudentFriendship.findById(id);
    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friend request not found' });
    }

    // Only the recipient may reject
    if (String(friendship.recipientUserId) !== String(studentUserId)) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this request' });
    }

    if (friendship.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${friendship.status}`
      });
    }

    friendship.status = 'REJECTED';
    friendship.respondedAt = new Date();
    await friendship.save();

    return res.json({
      success: true,
      message: 'Friend request rejected',
      friendship: {
        id: String(friendship._id),
        status: friendship.status,
        requesterUserId: String(friendship.requesterUserId),
        recipientUserId: String(friendship.recipientUserId),
        respondedAt: friendship.respondedAt
      }
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error rejecting request',
      error: error.message
    });
  }
};

export default {
  searchClassmates,
  sendFriendRequest,
  getStudentFriends,
  acceptFriendRequest,
  rejectFriendRequest
};
