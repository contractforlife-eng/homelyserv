// backend/src/controllers/complaintController.js
// ============================================================
// COMPLAINT MANAGEMENT SYSTEM - Full lifecycle controller
//
// Statuses: NEW, OPEN, IN_PROGRESS, WAITING_FOR_USER,
//           ESCALATED, RESOLVED, CLOSED
//
// Security:
//   - Users only see their own complaints
//   - Support sees assigned + unassigned complaints
//   - Admin sees all complaints
//   - Internal notes are never exposed to users
// ============================================================
import prisma from '../lib/prisma.js';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import {
  createNotification as createUserNotification,
  NOTIFICATION_TYPES,
  PRIORITIES,
} from '../services/notificationService.js';
import {
  resolveRequestIdentity,
  enrichAuthorIdentities,
} from '../utils/staffIdentity.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';

// ============================================================
// CONSTANTS
// ============================================================
export const COMPLAINT_STATUSES = [
  'NEW',
  'OPEN',
  'IN_PROGRESS',
  'WAITING_FOR_USER',
  'ESCALATED',
  'RESOLVED',
  'CLOSED'
];

export const COMPLAINT_CATEGORIES = [
  'Payments',
  'Account',
  'Hiring',
  'Messages',
  'Technical Issue',
  'Abuse',
  'Fraud',
  'Other'
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// ============================================================
// HELPERS
// ============================================================

/**
 * Generate a persistent sequential ticket number: HS-2026-000001
 * Uses the TicketCounter model to guarantee uniqueness per year.
 */
const generateTicketNumber = async () => {
  const year = new Date().getFullYear();
  const counter = await prisma.ticketCounter.upsert({
    where: { year },
    update: { sequence: { increment: 1 } },
    create: { year, sequence: 1 },
  });
  return `HS-${year}-${String(counter.sequence).padStart(6, '0')}`;
};

/**
 * Add a public reply to a complaint (conversation thread).
 * Replies are stored as structured records and are visible to
 * all authorized participants (user, support, admin).
 */
const addComplaintReply = async (complaintId, { authorId, authorName, authorRole, message, attachments = [] }) => {
  try {
    return await prisma.complaintReply.create({
      data: {
        complaintId,
        authorId,
        authorName,
        authorRole,
        message,
        attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
      },
    });
  } catch (error) {
    console.error('❌ Failed to add complaint reply:', error);
    return null;
  }
};

/**
 * Add a timeline event to a complaint.
 */
const addTimeline = async (complaintId, { action, description, authorId = null, authorName = null, authorRole = null, oldValue = null, newValue = null }) => {
  try {
    await prisma.complaintTimeline.create({
      data: {
        complaintId,
        action,
        description,
        authorId: authorId || undefined,
        authorName,
        authorRole,
        oldValue,
        newValue,
      },
    });
  } catch (error) {
    console.error('❌ Failed to add timeline event:', error);
  }
};

/**
 * Log support activity.
 */
const logSupportActivity = async (supportId, action, description, targetUserId = null, complaintId = null) => {
  try {
    await prisma.supportActivity.create({
      data: {
        supportId,
        action,
        description,
        targetUserId: targetUserId || undefined,
        complaintId: complaintId || undefined,
      },
    });
  } catch (error) {
    console.error('❌ Failed to log support activity:', error);
  }
};

/**
 * Build the conversation ID for a user <-> support conversation.
 */
const getConversationId = (user1Id, user2Id) => {
  const ids = [String(user1Id), String(user2Id)].sort();
  return `conv_${ids.join('_')}`;
};

/**
 * Ensure a SUPPORT conversation exists between a user and a support agent.
 * This integrates the complaint with the messaging architecture.
 */
const ensureSupportConversation = async (userId, supportId, complaintId = null) => {
  try {
    const conversationId = getConversationId(userId, supportId);

    const existing = await Conversation.findOne({ conversationId });
    if (existing) {
      if (complaintId && existing.type === 'SUPPORT') {
        await Conversation.updateOne(
          { conversationId },
          { complaintId }
        );
      }
      return conversationId;
    }

    // Look up user info
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: { id: true, fullName: true, role: true },
    });

    const support = await prisma.user.findUnique({
      where: { id: String(supportId) },
      select: { id: true, fullName: true, role: true },
    });

    await Conversation.create({
      conversationId,
      type: 'SUPPORT',
      participantIds: [String(userId), String(supportId)],
      supportAgentId: String(supportId),
      complaintId: complaintId || null,
      lastMessageAt: new Date(),
      lastMessagePreview: 'Complaint support conversation',
    });

    // Create an initial system message (identity resolved live from DB above)
    await Message.create({
      conversationId,
      senderId: String(supportId),
      senderName: support?.fullName || 'Support Agent',
      senderRole: support?.role || 'SUPPORT',
      recipientId: String(userId),
      recipientName: user?.fullName || 'User',
      recipientRole: user?.role || 'USER',
      text: 'This conversation is linked to your complaint. Support will respond here.',
      read: false,
      delivered: true,
    });

    return conversationId;
  } catch (error) {
    console.error('❌ Error ensuring support conversation:', error);
    return null;
  }
};

// ============================================================
// DYNAMIC STAFF IDENTITY
// Every complaint detail query joins the live Author record so
// names/roles ALWAYS come from the database — even for legacy
// records created before author data was stored correctly.
// ============================================================
const AUTHOR_SELECT = { id: true, fullName: true, role: true, profileImage: true };

const REPLIES_WITH_AUTHOR = {
  orderBy: { createdAt: 'asc' },
  include: { Author: { select: AUTHOR_SELECT } },
};

const TIMELINE_WITH_AUTHOR = {
  orderBy: { createdAt: 'asc' },
  include: { Author: { select: AUTHOR_SELECT } },
};

const NOTES_WITH_AUTHOR = {
  orderBy: { createdAt: 'desc' },
  include: { Author: { select: AUTHOR_SELECT } },
};

/**
 * Serialize any author-stamped record (reply, note, timeline event).
 * Prefers the live Author relation; falls back to the stored
 * authorName/authorRole snapshot for orphaned legacy records.
 * Always exposes a normalized `author: { id, name, role, image }`.
 */
const serializeAuthorRecord = (record) => {
  if (!record) return null;
  const { Author, ...rest } = record;
  const liveAuthor = Author
    ? {
        id: Author.id,
        name: Author.fullName,
        role: Author.role,
        image: Author.profileImage || Author.image || null,
      }
    : null;

  return {
    ...rest,
    authorName: liveAuthor?.name || record.authorName || null,
    authorRole: liveAuthor?.role || record.authorRole || null,
    author:
      liveAuthor ||
      (record.authorId
        ? {
            id: record.authorId,
            name: record.authorName || null,
            role: record.authorRole || null,
          }
        : null),
  };
};

/**
 * Serialize a complaint for API responses.
 * Internal notes are only included for staff (SUPPORT/ADMIN).
 */
const serializeComplaint = (complaint, { includeInternal = false } = {}) => {
  if (!complaint) return null;

  const base = {
    id: complaint.id,
    ticketNumber: complaint.ticketNumber || null,
    userId: complaint.userId,
    subject: complaint.subject,
    description: complaint.description,
    status: complaint.status,
    priority: complaint.priority,
    category: complaint.category || 'Other',
    assignedTo: complaint.assignedTo,
        assignedSupport: complaint.AssignedSupport
          ? {
              id: complaint.AssignedSupport.id,
              fullName: complaint.AssignedSupport.fullName,
              email: complaint.AssignedSupport.email,
              role: complaint.AssignedSupport.role,
              image: complaint.AssignedSupport.profileImage || complaint.AssignedSupport.image || null,
            }
          : null,
    assignedAdmin: complaint.assignedAdmin,
    escalatedBy: complaint.escalatedBy,
    escalatedAt: complaint.escalatedAt,
    escalationReason: complaint.escalationReason,
    attachments: complaint.attachments || [],
    resolvedAt: complaint.resolvedAt,
    closedAt: complaint.closedAt,
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt,
    replies: (complaint.Replies || []).map((reply) => {
      const serialized = serializeAuthorRecord(reply);
      return {
        id: serialized.id,
        complaintId: serialized.complaintId,
        authorId: serialized.authorId,
        authorName: serialized.authorName,
        authorRole: serialized.authorRole,
        author: serialized.author,
        message: serialized.message,
        attachments: serialized.attachments || [],
        createdAt: serialized.createdAt,
      };
    }),
        User: complaint.User
          ? {
              id: complaint.User.id,
              fullName: complaint.User.fullName,
              email: complaint.User.email,
              role: complaint.User.role,
              image: complaint.User.profileImage || complaint.User.image || null,
            }
          : null,
  };

  if (includeInternal) {
    base.internalNotes = complaint.internalNotes || null;
    base.adminNotes = complaint.adminNotes || null;
  }

  return base;
};

// ============================================================
// USER COMPLAINT ROUTES
// ============================================================

/**
 * POST /api/complaints
 * Create a new complaint (WORKER or EMPLOYER).
 */
export const createComplaint = async (req, res) => {
  try {
    const { subject, description, category, priority, attachments, hireId, workerEarningId } = req.body;
    const userId = String(req.userId);
    const userRole = req.userRole;

    if (userRole !== 'WORKER' && userRole !== 'EMPLOYER') {
      return res.status(403).json({
        success: false,
        message: 'Only workers and employers can create complaints',
      });
    }

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }

    const validCategory = COMPLAINT_CATEGORIES.includes(category);
    const validPriority = COMPLAINT_PRIORITIES.includes(priority);

    const ticketNumber = await generateTicketNumber();

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        userId,
        subject: subject.trim(),
        description: description.trim(),
        category: validCategory ? category : 'Other',
        priority: validPriority ? priority : 'Medium',
        status: 'NEW',
        attachments: Array.isArray(attachments) ? attachments.filter(Boolean) : [],
        // Optional Phase 2 linkage: populate only when valid ObjectIds are
        // provided so a dispute ticket traces back to the hire/earning.
        hireId: hireId && /^[0-9a-fA-F]{24}$/.test(String(hireId)) ? String(hireId) : null,
        workerEarningId: workerEarningId && /^[0-9a-fA-F]{24}$/.test(String(workerEarningId))
          ? String(workerEarningId)
          : null,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Timeline: complaint created
    await addTimeline(complaint.id, {
      action: 'CREATED',
      description: 'Complaint created',
      authorId: userId,
      authorName: complaint.User?.fullName || 'User',
      authorRole: userRole,
    });

    // Notify all support agents
    const supportUsers = await prisma.user.findMany({
      where: { role: 'SUPPORT' },
      select: { id: true },
    });

    for (const support of supportUsers) {
      await createUserNotification(support.id, {
        type: NOTIFICATION_TYPES.NEW_COMPLAINT,
        title: 'New Complaint',
        message: `New complaint: ${complaint.subject}`,
        entityType: 'COMPLAINT',
        entityId: complaint.id,
        priority: PRIORITIES.NORMAL,
        link: '/support-complaints',
      });
    }

    // Notify the user
    await createUserNotification(userId, {
      type: NOTIFICATION_TYPES.NEW_COMPLAINT,
      title: 'Complaint Submitted',
      message: `Your complaint "${complaint.subject}" has been submitted successfully`,
      entityType: 'COMPLAINT',
      entityId: complaint.id,
      priority: PRIORITIES.NORMAL,
      link: userRole === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint created successfully',
      complaint: serializeComplaint(complaint),
    });
  } catch (error) {
    console.error('❌ Error creating complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to create complaint' });
  }
};

/**
 * GET /api/complaints/my
 * Get the authenticated user's own complaints.
 */
export const getMyComplaints = async (req, res) => {
  try {
    const userId = String(req.userId);

    const complaints = await prisma.complaint.findMany({
      where: { userId },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      count: complaints.length,
      complaints: complaints.map((c) => serializeComplaint(c)),
    });
  } catch (error) {
    console.error('❌ Error fetching my complaints:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
};

/**
 * GET /api/complaints/:id
 * Get a single complaint (user must own it).
 */
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = String(req.userId);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        Timeline: TIMELINE_WITH_AUTHOR,
        Replies: REPLIES_WITH_AUTHOR,
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Security: users can only see their own complaints
    if (complaint.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this complaint' });
    }

    return res.json({
      success: true,
      complaint: serializeComplaint(complaint),
      timeline: (complaint.Timeline || []).map(serializeAuthorRecord),
    });
  } catch (error) {
    console.error('❌ Error fetching complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaint' });
  }
};

/**
 * POST /api/complaints/:id/reply
 * User replies to their complaint.
 */
export const userReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const userId = String(req.userId);

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Security: only the owner can reply
    if (complaint.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this complaint' });
    }

    // If complaint was WAITING_FOR_USER, move back to IN_PROGRESS
    let newStatus = complaint.status;
    if (complaint.status === 'WAITING_FOR_USER') {
      newStatus = 'IN_PROGRESS';
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: newStatus,
        internalNotes: complaint.internalNotes
          ? `${complaint.internalNotes}\n\n[User Reply - ${new Date().toISOString()}] ${message}`
          : `[User Reply - ${new Date().toISOString()}] ${message}`,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Store the reply as a structured conversation message
    await addComplaintReply(id, {
      authorId: userId,
      authorName: complaint.User?.fullName || 'User',
      authorRole: req.userRole || 'USER',
      message: message.trim(),
    });

    // Timeline
    await addTimeline(id, {
      action: 'USER_REPLIED',
      description: 'User replied to the complaint',
      authorId: userId,
      authorName: complaint.User?.fullName || 'User',
      authorRole: req.userRole,
    });

    // Notify assigned support
    const supportId = complaint.assignedSupport || complaint.assignedTo;
    if (supportId) {
      await createUserNotification(supportId, {
        type: NOTIFICATION_TYPES.COMPLAINT_REPLY,
        title: 'New User Reply',
        message: `${complaint.User?.fullName || 'User'} replied to "${complaint.subject}"`,
        entityType: 'COMPLAINT',
        entityId: id,
        priority: PRIORITIES.NORMAL,
        link: '/support-complaints',
      });
    }

    return res.json({
      success: true,
      message: 'Reply sent successfully',
      complaint: serializeComplaint(updated),
    });
  } catch (error) {
    console.error('❌ Error replying to complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
};

// ============================================================
// SUPPORT COMPLAINT ROUTES
// ============================================================

/**
 * GET /api/support/complaints
 * List complaints for support.
 * Support sees: unassigned complaints + complaints assigned to them.
 * Admin sees: all complaints.
 */
export const supportListComplaints = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, userId, search, page = 1, limit = 50 } = req.query;
    const supportId = String(req.userId);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (assignedTo) {
      where.assignedSupport = assignedTo;
    }

    if (userId) {
      where.userId = userId;
    }

    // SUPPORT and ADMIN both see ALL complaints.
    // The difference between roles is permissions, not visibility.
    // No assignment-scoped filter: every complaint is always visible.

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { subject: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.complaint.count({ where });

    const activePremiumIds = await getActivePremiumUserIds(complaints.map((c) => c.userId));
    const serializedComplaints = complaints.map((c) => serializeComplaint(c, { includeInternal: true }));
    serializedComplaints.forEach((item) => {
      if (item.User) item.User.isPremium = activePremiumIds.has(String(item.userId));
    });

    return res.json({
      success: true,
      count: complaints.length,
      total,
      page: parseInt(page),
      limit: take,
      complaints: serializedComplaints,
    });
  } catch (error) {
    console.error('❌ Error listing complaints for support:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
};

/**
 * GET /api/support/complaints/:id
 * Get a single complaint with full details for support/admin.
 */
export const supportGetComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        Notes: NOTES_WITH_AUTHOR,
        Timeline: TIMELINE_WITH_AUTHOR,
        Replies: REPLIES_WITH_AUTHOR,
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // SUPPORT and ADMIN both view all complaints.
    const activePremiumIds = await getActivePremiumUserIds([complaint.userId]);
    const serializedComplaint = serializeComplaint(complaint, { includeInternal: true });
    if (serializedComplaint.User) {
      serializedComplaint.User.isPremium = activePremiumIds.has(String(complaint.userId));
    }

    return res.json({
      success: true,
      complaint: serializedComplaint,
      notes: (complaint.Notes || []).map(serializeAuthorRecord),
      timeline: (complaint.Timeline || []).map(serializeAuthorRecord),
    });
  } catch (error) {
    console.error('❌ Error fetching complaint for support:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaint' });
  }
};

/**
 * POST /api/support/complaints/:id/assign
 * Assign a complaint to the current support agent.
 */
export const supportAssignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const supportId = String(req.userId);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // If already assigned to someone else, cannot reassign (admin can)
    if (complaint.assignedSupport && complaint.assignedSupport !== supportId) {
      return res.status(400).json({
        success: false,
        message: 'This complaint is already assigned to another support agent',
      });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assignedSupport: supportId,
        assignedTo: supportId,
        status: complaint.status === 'NEW' ? 'OPEN' : complaint.status,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, image: true },
        },
      },
    });

    // Resolve the REAL staff identity from the database (never from the JWT
    // payload or the client) so the timeline shows the actual agent name/role.
    const actor = await resolveRequestIdentity(req, 'Support Agent');

    // Timeline
    await addTimeline(id, {
      action: 'ASSIGNED',
      description: 'Support agent assigned to complaint',
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
      newValue: supportId,
    });

    // Log support activity
    await logSupportActivity(
      supportId,
      'COMPLAINT_ASSIGNED',
      `Assigned complaint "${complaint.subject}" to self`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.COMPLAINT_ASSIGNED,
      title: 'Complaint Assigned',
      message: `A support agent has been assigned to your complaint "${complaint.subject}"`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    // Ensure support conversation exists
    await ensureSupportConversation(complaint.userId, supportId, id);

    return res.json({
      success: true,
      message: 'Complaint assigned successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error assigning complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign complaint' });
  }
};

/**
 * POST /api/support/complaints/:id/reply
 * Support replies to a complaint (public reply visible to user).
 */
export const supportReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const supportId = String(req.userId);

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, image: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Support can reply to any visible complaint; auto-assign if unassigned.
    // Auto-assign if unassigned
    let assignedSupport = complaint.assignedSupport;
    if (!assignedSupport) {
      assignedSupport = supportId;
    }

    // Update status to IN_PROGRESS if NEW or OPEN
    let newStatus = complaint.status;
    if (complaint.status === 'NEW' || complaint.status === 'OPEN') {
      newStatus = 'IN_PROGRESS';
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: newStatus,
        assignedSupport,
        assignedTo: assignedSupport,
        internalNotes: complaint.internalNotes
          ? `${complaint.internalNotes}\n\n[Support Reply - ${new Date().toISOString()}] ${message}`
          : `[Support Reply - ${new Date().toISOString()}] ${message}`,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL staff identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Support Agent');

    // Store the reply as a structured conversation message
    await addComplaintReply(id, {
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
      message: message.trim(),
    });

    // Timeline
    await addTimeline(id, {
      action: 'SUPPORT_REPLIED',
      description: 'Support replied to the complaint',
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      supportId,
      'COMPLAINT_REPLIED',
      `Replied to complaint "${complaint.subject}"`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.COMPLAINT_REPLY,
      title: 'Support Response',
      message: `Support responded to your complaint "${complaint.subject}"`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    // Ensure support conversation exists and send message
    const conversationId = await ensureSupportConversation(complaint.userId, assignedSupport, id);
    if (conversationId) {
      try {
        await Message.create({
          conversationId,
          senderId: supportId,
          senderName: actor.name,
          senderRole: actor.role,
          recipientId: complaint.userId,
          recipientName: complaint.User?.fullName || 'User',
          recipientRole: complaint.User?.role || 'USER',
          text: message.trim(),
          read: false,
          delivered: true,
        });
        await Conversation.updateOne(
          { conversationId },
          { lastMessageAt: new Date(), lastMessagePreview: message.trim().slice(0, 120) }
        );
      } catch (msgError) {
        console.error('❌ Error sending support message:', msgError);
      }
    }

    return res.json({
      success: true,
      message: 'Reply sent successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error replying to complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to send reply' });
  }
};

/**
 * POST /api/support/complaints/:id/notes
 * Add an internal note (invisible to users).
 */
export const supportAddNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const supportId = String(req.userId);

    if (!note || !note.trim()) {
      return res.status(400).json({ success: false, message: 'Note is required' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      select: { id: true, subject: true, userId: true, internalNotes: true, assignedSupport: true },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Support can add notes to any visible complaint.
    const updatedNotes = complaint.internalNotes
      ? `${complaint.internalNotes}\n\n[Internal Note - ${new Date().toISOString()}] ${note}`
      : `[Internal Note - ${new Date().toISOString()}] ${note}`;

    const updated = await prisma.complaint.update({
      where: { id },
      data: { internalNotes: updatedNotes },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL staff identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Support Agent');

    // Create a structured note record
    await prisma.complaintNote.create({
      data: {
        complaintId: id,
        authorId: supportId,
        authorName: actor.name,
        authorRole: actor.role,
        note: note.trim(),
        isInternal: true,
      },
    });

    // Timeline
    await addTimeline(id, {
      action: 'NOTE_ADDED',
      description: 'Internal note added',
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      supportId,
      'COMPLAINT_NOTED',
      `Added internal note to complaint "${complaint.subject}"`,
      complaint.userId,
      id
    );

    return res.json({
      success: true,
      message: 'Internal note added successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error adding internal note:', error);
    return res.status(500).json({ success: false, message: 'Failed to add note' });
  }
};

/**
 * PUT /api/support/complaints/:id/status
 * Change complaint status.
 */
export const supportChangeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const supportId = String(req.userId);

    if (!COMPLAINT_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${COMPLAINT_STATUSES.join(', ')}`,
      });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Support can change status on any visible complaint.
    const data = { status };

    // Set resolvedAt / closedAt timestamps
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    }
    if (status === 'CLOSED') {
      data.closedAt = new Date();
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data,
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL staff identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Support Agent');

    // Timeline
    await addTimeline(id, {
      action: 'STATUS_CHANGED',
      description: `Status changed from ${complaint.status} to ${status}`,
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
      oldValue: complaint.status,
      newValue: status,
    });

    // Log support activity
    await logSupportActivity(
      supportId,
      'COMPLAINT_STATUS_CHANGED',
      `Changed complaint "${complaint.subject}" status from ${complaint.status} to ${status}`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: status === 'RESOLVED' ? NOTIFICATION_TYPES.COMPLAINT_RESOLVED : NOTIFICATION_TYPES.SYSTEM,
      title: 'Complaint Status Updated',
      message: `Your complaint "${complaint.subject}" is now ${status.replace(/_/g, ' ')}`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    return res.json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error changing complaint status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};

/**
 * POST /api/support/complaints/:id/escalate
 * Escalate a complaint to Admin.
 * Integrates with the messaging architecture:
 *   - status -> ESCALATED
 *   - saves escalatedBy, escalatedAt, reason
 *   - notifies Admin
 *   - makes conversation visible to Admin (type -> ESCALATED)
 */
export const supportEscalate = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const supportId = String(req.userId);

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Escalation reason is required' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Support can escalate any visible complaint.
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'ESCALATED',
        escalatedBy: supportId,
        escalatedAt: new Date(),
        escalationReason: reason.trim(),
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL staff identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Support Agent');

    // Timeline
    await addTimeline(id, {
      action: 'ESCALATED',
      description: `Complaint escalated to admin. Reason: ${reason.trim()}`,
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      supportId,
      'COMPLAINT_ESCALATED',
      `Escalated complaint "${complaint.subject}" to admin. Reason: ${reason.trim()}`,
      complaint.userId,
      id
    );

    // Notify all admins
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    for (const admin of adminUsers) {
      await createUserNotification(admin.id, {
        type: NOTIFICATION_TYPES.COMPLAINT_ESCALATED,
        title: 'Complaint Escalated',
        message: `Complaint "${complaint.subject}" was escalated by ${actor.name}`,
        entityType: 'COMPLAINT',
        entityId: id,
        priority: PRIORITIES.HIGH,
        link: '/admin/complaints',
      });
    }

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.COMPLAINT_ESCALATED,
      title: 'Complaint Escalated',
      message: `Your complaint "${complaint.subject}" has been escalated to our admin team`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.HIGH,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    // ============================================================
    // MESSAGING ARCHITECTURE INTEGRATION
    // Make the conversation visible to Admin by upgrading to ESCALATED
    // ============================================================
    const supportAgentId = complaint.assignedSupport || supportId;
    const conversationId = getConversationId(complaint.userId, supportAgentId);

    const existingConv = await Conversation.findOne({ conversationId });
    if (existingConv) {
      await Conversation.updateOne(
        { conversationId },
        {
          type: 'ESCALATED',
          complaintId: id,
          escalatedBy: supportId,
          escalatedAt: new Date(),
          escalationReason: reason.trim(),
        }
      );
    } else {
      // Create the conversation if it doesn't exist yet
      await Conversation.create({
        conversationId,
        type: 'ESCALATED',
        participantIds: [complaint.userId, supportAgentId],
        supportAgentId,
        complaintId: id,
        escalatedBy: supportId,
        escalatedAt: new Date(),
        escalationReason: reason.trim(),
        lastMessageAt: new Date(),
        lastMessagePreview: `Escalated: ${reason.trim().slice(0, 120)}`,
      });
    }

    return res.json({
      success: true,
      message: 'Complaint escalated to admin successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
      conversationId,
    });
  } catch (error) {
    console.error('❌ Error escalating complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to escalate complaint' });
  }
};

/**
 * POST /api/support/complaints/:id/close
 * Close a complaint.
 */
export const supportClose = async (req, res) => {
  try {
    const { id } = req.params;
    const supportId = String(req.userId);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Support can close any visible complaint.
    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL staff identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Support Agent');

    // Timeline
    await addTimeline(id, {
      action: 'CLOSED',
      description: 'Complaint closed',
      authorId: supportId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      supportId,
      'COMPLAINT_CLOSED',
      `Closed complaint "${complaint.subject}"`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Complaint Closed',
      message: `Your complaint "${complaint.subject}" has been closed`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    return res.json({
      success: true,
      message: 'Complaint closed successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error closing complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to close complaint' });
  }
};

// ============================================================
// ADMIN COMPLAINT ROUTES
// ============================================================

/**
 * GET /api/admin/complaints
 * Admin sees all complaints with filters.
 */
export const adminListComplaints = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, userId, search, page = 1, limit = 50 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (assignedTo) {
      where.assignedSupport = assignedTo;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { subject: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.complaint.count({ where });

    const activePremiumIds = await getActivePremiumUserIds(complaints.map((c) => c.userId));
    const serializedComplaints = complaints.map((c) => serializeComplaint(c, { includeInternal: true }));
    serializedComplaints.forEach((item) => {
      if (item.User) item.User.isPremium = activePremiumIds.has(String(item.userId));
    });

    return res.json({
      success: true,
      count: complaints.length,
      total,
      page: parseInt(page),
      limit: take,
      complaints: serializedComplaints,
    });
  } catch (error) {
    console.error('❌ Error listing complaints for admin:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaints' });
  }
};

/**
 * GET /api/admin/complaints/:id
 * Admin gets a single complaint with full details.
 */
export const adminGetComplaint = async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        Notes: NOTES_WITH_AUTHOR,
        Timeline: TIMELINE_WITH_AUTHOR,
        Replies: REPLIES_WITH_AUTHOR,
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    return res.json({
      success: true,
      complaint: serializeComplaint(complaint, { includeInternal: true }),
      notes: (complaint.Notes || []).map(serializeAuthorRecord),
      timeline: (complaint.Timeline || []).map(serializeAuthorRecord),
    });
  } catch (error) {
    console.error('❌ Error fetching complaint for admin:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaint' });
  }
};

/**
 * POST /api/admin/complaints/:id/reply
 * Admin replies to a complaint.
 */
export const adminReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = String(req.userId);

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assignedAdmin: adminId,
        adminNotes: complaint.adminNotes
          ? `${complaint.adminNotes}\n\n[Admin Reply - ${new Date().toISOString()}] ${message}`
          : `[Admin Reply - ${new Date().toISOString()}] ${message}`,
        status: complaint.status === 'ESCALATED' ? 'IN_PROGRESS' : complaint.status,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL admin identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Admin');

    // Store the reply as a structured conversation message
    await addComplaintReply(id, {
      authorId: adminId,
      authorName: actor.name,
      authorRole: actor.role,
      message: message.trim(),
    });

    // Timeline
    await addTimeline(id, {
      action: 'ADMIN_REPLIED',
      description: 'Admin replied to the complaint',
      authorId: adminId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      adminId,
      'COMPLAINT_ADMIN_REPLIED',
      `Admin replied to complaint "${complaint.subject}"`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.COMPLAINT_REPLY,
      title: 'Admin Response',
      message: `Admin responded to your complaint "${complaint.subject}"`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    // Notify assigned support
    if (complaint.assignedSupport) {
      await createUserNotification(complaint.assignedSupport, {
        type: NOTIFICATION_TYPES.COMPLAINT_REPLY,
        title: 'Admin Replied',
        message: `Admin replied to complaint "${complaint.subject}"`,
        entityType: 'COMPLAINT',
        entityId: id,
        priority: PRIORITIES.NORMAL,
        link: '/support-complaints',
      });
    }

    return res.json({
      success: true,
      message: 'Admin reply sent successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error replying as admin:', error);
    return res.status(500).json({ success: false, message: 'Failed to send admin reply' });
  }
};

/**
 * POST /api/admin/complaints/:id/reassign
 * Admin reassigns a complaint to a support agent.
 */
export const adminReassign = async (req, res) => {
  try {
    const { id } = req.params;
    const { supportId } = req.body;
    const adminId = String(req.userId);

    if (!supportId) {
      return res.status(400).json({ success: false, message: 'Support agent ID is required' });
    }

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verify the support agent exists
    const supportUser = await prisma.user.findUnique({
      where: { id: supportId },
      select: { id: true, fullName: true, role: true },
    });

    if (!supportUser || supportUser.role !== 'SUPPORT') {
      return res.status(400).json({ success: false, message: 'Invalid support agent' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        assignedSupport: supportId,
        assignedTo: supportId,
        status: complaint.status === 'ESCALATED' ? 'IN_PROGRESS' : complaint.status,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL admin identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Admin');

    // Timeline
    await addTimeline(id, {
      action: 'REASSIGNED',
      description: `Complaint reassigned to ${supportUser.fullName || 'support agent'}`,
      authorId: adminId,
      authorName: actor.name,
      authorRole: actor.role,
      oldValue: complaint.assignedSupport,
      newValue: supportId,
    });

    // Log support activity
    await logSupportActivity(
      adminId,
      'COMPLAINT_REASSIGNED',
      `Reassigned complaint "${complaint.subject}" to ${supportUser.fullName || supportId}`,
      complaint.userId,
      id
    );

    // Notify the new support agent
    await createUserNotification(supportId, {
      type: NOTIFICATION_TYPES.COMPLAINT_ASSIGNED,
      title: 'Complaint Assigned',
      message: `Complaint "${complaint.subject}" has been assigned to you`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: '/support-complaints',
    });

    return res.json({
      success: true,
      message: 'Complaint reassigned successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error reassigning complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to reassign complaint' });
  }
};

/**
 * GET /api/admin/complaints/escalated
 * Get only escalated complaints (backward-compatible with AdminDashboard).
 */
export const adminEscalatedComplaints = async (req, res) => {
  try {
    const complaints = await prisma.complaint.findMany({
      where: {
        status: 'ESCALATED',
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      orderBy: { escalatedAt: 'desc' },
    });

    return res.json({
      success: true,
      count: complaints.length,
      complaints: complaints.map((c) => serializeComplaint(c, { includeInternal: true })),
    });
  } catch (error) {
    console.error('❌ Error fetching escalated complaints:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch escalated complaints' });
  }
};

/**
 * PUT /api/admin/complaints/:id/resolve
 * Admin resolves a complaint.
 */
export const adminResolve = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = String(req.userId);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        assignedAdmin: adminId,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL admin identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Admin');

    // Timeline
    await addTimeline(id, {
      action: 'RESOLVED',
      description: 'Complaint resolved by admin',
      authorId: adminId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      adminId,
      'COMPLAINT_RESOLVED',
      `Resolved complaint "${complaint.subject}"`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.COMPLAINT_RESOLVED,
      title: 'Complaint Resolved',
      message: `Your complaint "${complaint.subject}" has been resolved`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    return res.json({
      success: true,
      message: 'Complaint resolved successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error resolving complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve complaint' });
  }
};

/**
 * PUT /api/admin/complaints/:id/close
 * Admin closes a complaint.
 */
export const adminClose = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = String(req.userId);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        assignedAdmin: adminId,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL admin identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Admin');

    // Timeline
    await addTimeline(id, {
      action: 'CLOSED',
      description: 'Complaint closed by admin',
      authorId: adminId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      adminId,
      'COMPLAINT_CLOSED',
      `Closed complaint "${complaint.subject}"`,
      complaint.userId,
      id
    );

    // Notify the user
    await createUserNotification(complaint.userId, {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'Complaint Closed',
      message: `Your complaint "${complaint.subject}" has been closed`,
      entityType: 'COMPLAINT',
      entityId: id,
      priority: PRIORITIES.NORMAL,
      link: complaint.User?.role === 'WORKER' ? '/worker-complaints' : '/employer-complaints',
    });

    return res.json({
      success: true,
      message: 'Complaint closed successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error closing complaint:', error);
    return res.status(500).json({ success: false, message: 'Failed to close complaint' });
  }
};

/**
 * POST /api/admin/complaints/:id/return
 * Return an escalated complaint back to support.
 */
export const adminReturnToSupport = async (req, res) => {
  try {
    const { id } = req.params;
    const { supportId, note } = req.body;
    const adminId = String(req.userId);

    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const targetSupportId = supportId || complaint.assignedSupport;

    const updated = await prisma.complaint.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        assignedSupport: targetSupportId,
        assignedTo: targetSupportId,
        adminNotes: note
          ? `${complaint.adminNotes || ''}\n\n[Returned to Support - ${new Date().toISOString()}] ${note}`
          : complaint.adminNotes,
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
    });

    // Resolve the REAL admin identity from the database (single lookup).
    const actor = await resolveRequestIdentity(req, 'Admin');

    // Timeline
    await addTimeline(id, {
      action: 'RETURNED_TO_SUPPORT',
      description: 'Complaint returned to support by admin',
      authorId: adminId,
      authorName: actor.name,
      authorRole: actor.role,
    });

    // Log support activity
    await logSupportActivity(
      adminId,
      'COMPLAINT_RETURNED',
      `Returned complaint "${complaint.subject}" to support`,
      complaint.userId,
      id
    );

    // Notify the support agent
    if (targetSupportId) {
      await createUserNotification(targetSupportId, {
        type: NOTIFICATION_TYPES.COMPLAINT_ASSIGNED,
        title: 'Complaint Returned',
        message: `Complaint "${complaint.subject}" was returned to you by admin`,
        entityType: 'COMPLAINT',
        entityId: id,
        priority: PRIORITIES.NORMAL,
        link: '/support-complaints',
      });
    }

    return res.json({
      success: true,
      message: 'Complaint returned to support successfully',
      complaint: serializeComplaint(updated, { includeInternal: true }),
    });
  } catch (error) {
    console.error('❌ Error returning complaint to support:', error);
    return res.status(500).json({ success: false, message: 'Failed to return complaint' });
  }
};

// ============================================================
// STATISTICS
// ============================================================

/**
 * GET /api/support/stats
 * Support dashboard statistics.
 */
export const supportStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total users
    const totalUsers = await prisma.user.count();

    // Total conversations
    const totalConversations = await Message.distinct('conversationId').then((ids) => ids.filter(Boolean).length);

    // Unread messages
    const unreadMessages = await Message.countDocuments({ read: false });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true },
    });

    const roleStats = {};
    usersByRole.forEach((item) => {
      roleStats[item.role] = item._count.role;
    });

    // Complaint statistics
    const complaintStats = await prisma.complaint.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const complaintStatusStats = {};
    complaintStats.forEach((item) => {
      complaintStatusStats[item.status] = item._count.status;
    });

    // Open complaints (NEW + OPEN + IN_PROGRESS + WAITING_FOR_USER)
    const openComplaints =
      (complaintStatusStats['NEW'] || 0) +
      (complaintStatusStats['OPEN'] || 0) +
      (complaintStatusStats['IN_PROGRESS'] || 0) +
      (complaintStatusStats['WAITING_FOR_USER'] || 0);

    // In progress
    const inProgressComplaints = complaintStatusStats['IN_PROGRESS'] || 0;

    // Escalated
    const escalatedComplaints = complaintStatusStats['ESCALATED'] || 0;

    // Critical complaints
    const criticalComplaints = await prisma.complaint.count({
      where: {
        priority: 'Critical',
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });

    // Waiting for user
    const waitingComplaints = complaintStatusStats['WAITING_FOR_USER'] || 0;

    // Resolved today
    const resolvedToday = await prisma.complaint.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: { gte: today },
      },
    });

    // Average resolution time (in hours) for resolved complaints
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionHours = Math.round((totalMs / resolvedComplaints.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // Users assisted today
    const usersAssistedToday = await prisma.supportActivity.groupBy({
      by: ['targetUserId'],
      where: {
        createdAt: { gte: today },
        targetUserId: { not: null },
      },
      _count: { targetUserId: true },
    });

    // Support performance (complaints handled per support agent)
    const supportPerformance = await prisma.complaint.groupBy({
      by: ['assignedSupport'],
      where: {
        assignedSupport: { not: null },
      },
      _count: { assignedSupport: true },
    });

    const performanceMap = {};
    for (const item of supportPerformance) {
      const agent = await prisma.user.findUnique({
        where: { id: item.assignedSupport },
        select: { id: true, fullName: true, email: true },
      });
      if (agent) {
        performanceMap[item.assignedSupport] = {
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          count: item._count.assignedSupport,
        };
      }
    }

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalConversations,
        unreadMessages,
        usersByRole: roleStats,
        openComplaints,
        inProgressComplaints,
        escalatedComplaints,
        criticalComplaints,
        waitingComplaints,
        resolvedToday,
        avgResolutionHours,
        usersAssistedToday: usersAssistedToday.length,
        supportPerformance: Object.values(performanceMap),
        complaintStatusStats,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching support stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
  }
};

/**
 * GET /api/support/dashboard
 * Production-ready support workspace data.
 * Returns KPI stats, needs-attention tickets, assigned tickets,
 * waiting-for-user tickets, recent activity, and recent conversations.
 */
export const supportDashboard = async (req, res) => {
  try {
    const supportId = String(req.userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================================
    // KPI COUNTS
    // ============================================================

    // Open tickets (NEW + OPEN + IN_PROGRESS + WAITING_FOR_USER)
    const openTickets = await prisma.complaint.count({
      where: {
        status: { in: ['NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_USER'] },
      },
    });

    // Assigned to me (not resolved/closed)
    const assignedToMe = await prisma.complaint.count({
      where: {
        assignedSupport: supportId,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });

    // Waiting for user
    const waitingForUser = await prisma.complaint.count({
      where: { status: 'WAITING_FOR_USER' },
    });

    // Critical tickets (not resolved/closed)
    const criticalTickets = await prisma.complaint.count({
      where: {
        priority: 'Critical',
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });

    // Escalated tickets
    const escalatedTickets = await prisma.complaint.count({
      where: { status: 'ESCALATED' },
    });

    // Resolved today
    const resolvedToday = await prisma.complaint.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: { gte: today },
      },
    });

    // ============================================================
    // AVERAGE FIRST RESPONSE TIME
    // For each complaint, find the first SUPPORT_REPLIED timeline
    // event and compute the delta from createdAt.
    // ============================================================
    let avgFirstResponseHours = 0;
    try {
      const complaintsWithReplies = await prisma.complaint.findMany({
        where: {
          Timeline: {
            some: { action: 'SUPPORT_REPLIED' },
          },
        },
        select: {
          id: true,
          createdAt: true,
          Timeline: {
            where: { action: 'SUPPORT_REPLIED' },
            orderBy: { createdAt: 'asc' },
            take: 1,
            select: { createdAt: true },
          },
        },
      });

      if (complaintsWithReplies.length > 0) {
        const totalMs = complaintsWithReplies.reduce((sum, c) => {
          const firstReply = c.Timeline[0];
          if (!firstReply) return sum;
          return sum + (new Date(firstReply.createdAt) - new Date(c.createdAt));
        }, 0);
        avgFirstResponseHours = Math.round((totalMs / complaintsWithReplies.length) / (1000 * 60 * 60) * 10) / 10;
      }
    } catch (e) {
      console.error('❌ Error computing avg first response time:', e.message);
    }

    // ============================================================
    // AVERAGE RESOLUTION TIME
    // ============================================================
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionHours = Math.round((totalMs / resolvedComplaints.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // ============================================================
    // NEEDS ATTENTION
    // Order: Critical > Escalated > Waiting > Newest
    // ============================================================
    const needsAttention = await prisma.complaint.findMany({
      where: {
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 10,
    });

    // Sort by priority weight: Critical > Escalated > Waiting > Newest
    const priorityWeight = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    const statusWeight = { ESCALATED: 0, WAITING_FOR_USER: 1, NEW: 2, OPEN: 3, IN_PROGRESS: 4 };
    needsAttention.sort((a, b) => {
      const aW = (priorityWeight[a.priority] ?? 4) * 10 + (statusWeight[a.status] ?? 5);
      const bW = (priorityWeight[b.priority] ?? 4) * 10 + (statusWeight[b.status] ?? 5);
      return aW - bW;
    });

    // ============================================================
    // MY ASSIGNED TICKETS
    // ============================================================
    const myAssignedTickets = await prisma.complaint.findMany({
      where: {
        assignedSupport: supportId,
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // ============================================================
    // WAITING FOR USER TICKETS
    // ============================================================
    const waitingTickets = await prisma.complaint.findMany({
      where: { status: 'WAITING_FOR_USER' },
      include: {
        User: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
        AssignedSupport: {
          select: { id: true, fullName: true, email: true, role: true, profileImage: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // ============================================================
    // RECENT ACTIVITY (ComplaintTimeline)
    // ============================================================
    const recentActivity = await prisma.complaintTimeline.findMany({
      where: {
        action: { in: ['CREATED', 'ASSIGNED', 'USER_REPLIED', 'SUPPORT_REPLIED', 'ADMIN_REPLIED', 'ESCALATED', 'RESOLVED', 'CLOSED'] },
      },
      include: {
        Complaint: {
          select: { id: true, ticketNumber: true, subject: true, status: true, priority: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });

    // Enrich activity authors with live identities from the database
    const enrichedRecentActivity = await enrichAuthorIdentities(recentActivity);

    // ============================================================
    // RECENT CONVERSATIONS (secure messaging architecture)
    // ============================================================
    let recentConversations = [];
    try {
      const Conversation = (await import('../models/Conversation.js')).default;
      const query = { type: 'SUPPORT' };
      if (req.userRole === 'SUPPORT') {
        query.supportAgentId = supportId;
      }

      const conversationsMeta = await Conversation.find(query)
        .sort({ lastMessageAt: -1 })
        .limit(8);

      for (const conv of conversationsMeta) {
        const lastMsg = await Message.findOne({ conversationId: conv.conversationId })
          .sort({ createdAt: -1 });

        if (!lastMsg) continue;

        const userParticipantId = conv.participantIds.find(
          id => id !== conv.supportAgentId
        );

        let userInfo = null;
        if (userParticipantId) {
          try {
          userInfo = await prisma.user.findUnique({
            where: { id: userParticipantId },
            select: { id: true, fullName: true, email: true, role: true, profileImage: true },
          });
          } catch (e) {
            console.error('Error fetching user:', e.message);
          }
        }

        recentConversations.push({
          id: conv.conversationId,
          type: conv.type,
          userId: userParticipantId || null,
          user: userInfo,
          supportAgentId: conv.supportAgentId,
          lastMessage: lastMsg.text,
          lastMessageTime: lastMsg.createdAt,
          updatedAt: conv.lastMessageAt || lastMsg.createdAt,
          complaintId: conv.complaintId || null,
        });
      }
    } catch (e) {
      console.error('❌ Error fetching recent conversations:', e.message);
    }

    return res.json({
      success: true,
      stats: {
        openTickets,
        assignedToMe,
        waitingForUser,
        criticalTickets,
        escalatedTickets,
        resolvedToday,
        avgFirstResponseHours,
        avgResolutionHours,
      },
      needsAttention: needsAttention.map((c) => serializeComplaint(c)),
      myAssignedTickets: myAssignedTickets.map((c) => serializeComplaint(c)),
      waitingTickets: waitingTickets.map((c) => serializeComplaint(c)),
      recentActivity: enrichedRecentActivity,
      recentConversations,
    });
  } catch (error) {
    console.error('❌ Error fetching support dashboard:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch support dashboard' });
  }
};

/**
 * GET /api/admin/complaints/stats
 * Admin complaint statistics.
 */
export const adminComplaintStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalComplaints = await prisma.complaint.count();

    const complaintStats = await prisma.complaint.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const statusStats = {};
    complaintStats.forEach((item) => {
      statusStats[item.status] = item._count.status;
    });

    const escalatedComplaints = statusStats['ESCALATED'] || 0;

    const criticalComplaints = await prisma.complaint.count({
      where: {
        priority: 'Critical',
        status: { notIn: ['RESOLVED', 'CLOSED'] },
      },
    });

    const waitingComplaints = statusStats['WAITING_FOR_USER'] || 0;

    const solvedToday = await prisma.complaint.count({
      where: {
        status: 'RESOLVED',
        resolvedAt: { gte: today },
      },
    });

    // Average resolution time
    const resolvedComplaints = await prisma.complaint.findMany({
      where: {
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionHours = 0;
    if (resolvedComplaints.length > 0) {
      const totalMs = resolvedComplaints.reduce((sum, c) => {
        return sum + (new Date(c.resolvedAt) - new Date(c.createdAt));
      }, 0);
      avgResolutionHours = Math.round((totalMs / resolvedComplaints.length) / (1000 * 60 * 60) * 10) / 10;
    }

    // Support performance
    const supportPerformance = await prisma.complaint.groupBy({
      by: ['assignedSupport'],
      where: {
        assignedSupport: { not: null },
      },
      _count: { assignedSupport: true },
    });

    const performanceMap = {};
    for (const item of supportPerformance) {
      const agent = await prisma.user.findUnique({
        where: { id: item.assignedSupport },
        select: { id: true, fullName: true, email: true },
      });
      if (agent) {
        performanceMap[item.assignedSupport] = {
          id: agent.id,
          fullName: agent.fullName,
          email: agent.email,
          count: item._count.assignedSupport,
        };
      }
    }

    return res.json({
      success: true,
      stats: {
        totalComplaints,
        escalatedComplaints,
        criticalComplaints,
        waitingComplaints,
        solvedToday,
        avgResolutionHours,
        statusStats,
        supportPerformance: Object.values(performanceMap),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching admin complaint stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch complaint statistics' });
  }
};

export default {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  userReply,
  supportListComplaints,
  supportGetComplaint,
  supportAssignComplaint,
  supportReply,
  supportAddNote,
  supportChangeStatus,
  supportEscalate,
  supportClose,
  adminListComplaints,
  adminGetComplaint,
  adminReply,
  adminReassign,
  adminResolve,
  adminClose,
  adminReturnToSupport,
  adminEscalatedComplaints,
  supportStats,
  supportDashboard,
  adminComplaintStats,
};
