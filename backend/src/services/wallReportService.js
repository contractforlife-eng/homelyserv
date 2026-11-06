import prisma from '../lib/prisma.js';
import { WallReport, WallContent } from '../models/Wall.js';
import User from '../models/User.js';
import { generateTicketNumber } from '../controllers/complaintController.js';
import { createNotification, NOTIFICATION_TYPES } from './notificationService.js';

export function buildWallComplaint(report, ticketNumber) {
  const comment = report.contentType === 'COMMENT';
  return {
    id: String(report._id), ticketNumber, userId: String(report.userId),
    subject: comment ? 'HomelyServ Wall — Comment report' : 'HomelyServ Wall — Post report',
    description: report.reason, category: 'Abuse', priority: 'High', status: 'NEW', attachments: [],
    reportedUserId: report.snapshot?.authorId || null,
    wallContentId: String(report.contentId), wallPostId: String(report.postId),
    wallContentType: report.contentType, wallSnapshot: report.snapshot || {},
    Timeline: { create: { action: 'CREATED', description: 'Wall content report received', authorId: String(report.userId), authorRole: report.reporterRole } },
  };
}

// The report's durable ObjectId is also the complaint's ObjectId. Retries,
// concurrent submissions and interrupted handoffs all resolve to one ticket.
export async function deliverWallReport(report, dependencies = {}) {
  if (!report.postId || !report.snapshot || !report.contentType) report = await hydrateWallReport(report);
  const db = dependencies.db || prisma;
  const nextTicket = dependencies.nextTicket || generateTicketNumber;
  const notify = dependencies.notify || createNotification;
  const markDelivered = dependencies.markDelivered || (id => WallReport.updateOne({ _id: id }, { $set: { complaintHandedOff: true } }));
  const id = String(report._id);
  let complaint = await db.complaint.findUnique({ where: { id } });
  if (complaint && (complaint.wallContentId !== String(report.contentId) || complaint.userId !== String(report.userId))) throw new Error('WALL_COMPLAINT_CONFLICT');
  if (!complaint) complaint = await db.complaint.upsert({ where: { id }, update: {}, create: buildWallComplaint(report, await nextTicket()) });
  const recipients = await db.user.findMany({ where: { role: { in: ['ADMIN', 'SUPPORT'] } }, select: { id: true, role: true } });
  let delivered = true;
  for (const recipient of recipients) {
    const notification = await notify(recipient.id, {
      type: NOTIFICATION_TYPES.NEW_COMPLAINT, title: 'HomelyServ Wall report', message: `${complaint.ticketNumber}: ${complaint.subject}`,
      entityType: 'COMPLAINT', entityId: id, icon: '🚩', priority: 'HIGH',
      link: `${recipient.role === 'ADMIN' ? '/admin/complaints' : '/support-complaints'}?id=${id}`,
      eventKey: `wall-report:${id}:${recipient.id}`, data: { source: 'WALL', wallContentId: String(report.contentId) },
    });
    if (!notification) delivered = false;
  }
  if (delivered) await markDelivered(report._id);
  return complaint;
}

async function hydrateWallReport(report) {
  const content = await WallContent.findById(report.contentId).lean();
  const [author, reporter] = await Promise.all([
    content?.authorId ? User.findById(content.authorId).select('fullName').lean() : null,
    User.findById(report.userId).select('role').lean(),
  ]);
  const fields = { postId: content?.postId || report.contentId, contentType: content?.postId ? 'COMMENT' : 'POST', reporterRole: report.reporterRole || reporter?.role || 'USER',
    snapshot: { authorId: content?.authorId || null, authorName: author?.fullName || '', text: content?.text || '', image: content?.image?.url || null, createdAt: content?.createdAt?.toISOString() || null } };
  await WallReport.updateOne({ _id: report._id }, { $set: fields });
  return { ...report, ...fields };
}

let running = false;
export async function reconcileWallReports() {
  if (running) return;
  running = true;
  try {
    const reports = await WallReport.find({ complaintHandedOff: { $ne: true } }).sort({ _id: 1 }).limit(50).lean();
    for (const report of reports) {
      try { await deliverWallReport(report); }
      catch (error) { console.error('Wall report handoff pending:', error.name); }
    }
  } finally { running = false; }
}
