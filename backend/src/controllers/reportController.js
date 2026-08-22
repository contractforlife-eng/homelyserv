import prisma from '../lib/prisma.js';
import { createStructuredComplaint, serializeComplaint } from './complaintController.js';
import {
  ReportValidationError,
  validateMessageReport,
  validateProfileReport,
  validateReportText,
  validateUserReport,
} from '../services/reportValidationService.js';

const REPORT_CATEGORIES = new Set(['Abuse', 'Fraud', 'Messages', 'Other']);

const handleError = (res, error) => {
  if (error instanceof ReportValidationError) {
    return res.status(error.statusCode).json({ success: false, message: error.message });
  }
  console.error('Structured report error:', error);
  return res.status(500).json({ success: false, message: 'Failed to submit report' });
};

const rejectDuplicate = async ({ reporterId, reportedUserId, conversationId = null, messageId = null }) => {
  const existing = await prisma.complaint.findFirst({
    where: {
      userId: String(reporterId),
      reportedUserId: String(reportedUserId),
      conversationId: conversationId ? String(conversationId) : null,
      messageId: messageId ? String(messageId) : null,
      status: { notIn: ['RESOLVED', 'CLOSED'] },
    },
    select: { id: true },
  });
  if (existing) throw new ReportValidationError('This report has already been submitted', 409);
};

const buildSubject = (kind, reason) => `${kind} report: ${reason}`;

export const reportUser = async (req, res) => {
  try {
    if (!['WORKER', 'EMPLOYER'].includes(req.userRole)) {
      throw new ReportValidationError('Only workers and employers can report users', 403);
    }
    const { reason, description } = validateReportText(req.body || {});
    const category = REPORT_CATEGORIES.has(req.body?.category) ? req.body.category : 'Abuse';
    const context = await validateUserReport({
      reporterId: req.userId,
      reporterRole: req.userRole,
      conversationId: req.body?.conversationId,
      reportedUserId: req.body?.reportedUserId,
    });
    await rejectDuplicate({ reporterId: req.userId, reportedUserId: context.reportedUserId, conversationId: context.id });

    const complaint = await createStructuredComplaint({
      reporterId: req.userId,
      reporterRole: req.userRole,
      subject: buildSubject('User', reason),
      description,
      category,
      reportedUserId: context.reportedUserId,
      conversationId: context.id,
    });

    return res.status(201).json({ success: true, message: 'Report submitted successfully', complaint: serializeComplaint(complaint) });
  } catch (error) {
    return handleError(res, error);
  }
};

export const reportMessage = async (req, res) => {
  try {
    if (!['WORKER', 'EMPLOYER'].includes(req.userRole)) {
      throw new ReportValidationError('Only workers and employers can report messages', 403);
    }
    const { reason, description } = validateReportText(req.body || {});
    const context = await validateMessageReport({
      reporterId: req.userId,
      reporterRole: req.userRole,
      conversationId: req.body?.conversationId,
      messageId: req.body?.messageId,
    });
    await rejectDuplicate({
      reporterId: req.userId,
      reportedUserId: context.reportedUserId,
      conversationId: context.id,
      messageId: context.messageId,
    });

    const complaint = await createStructuredComplaint({
      reporterId: req.userId,
      reporterRole: req.userRole,
      subject: buildSubject('Message', reason),
      description,
      category: 'Messages',
      reportedUserId: context.reportedUserId,
      messageId: context.messageId,
      conversationId: context.id,
    });

    return res.status(201).json({ success: true, message: 'Report submitted successfully', complaint: serializeComplaint(complaint) });
  } catch (error) {
    return handleError(res, error);
  }
};

export const reportProfile = async (req, res) => {
  try {
    if (!['WORKER', 'EMPLOYER'].includes(req.userRole)) {
      throw new ReportValidationError('Only workers and employers can report profiles', 403);
    }
    const { reason, description } = validateReportText(req.body || {});
    const category = REPORT_CATEGORIES.has(req.body?.category) ? req.body.category : 'Abuse';
    const context = await validateProfileReport({
      reporterId: req.userId,
      reporterRole: req.userRole,
      reportedUserId: req.body?.reportedUserId,
    });
    await rejectDuplicate({
      reporterId: req.userId,
      reportedUserId: context.reportedUserId,
    });

    const complaint = await createStructuredComplaint({
      reporterId: req.userId,
      reporterRole: req.userRole,
      subject: buildSubject('Profile', reason),
      description,
      category,
      reportedUserId: context.reportedUserId,
    });

    return res.status(201).json({ success: true, message: 'Report submitted successfully', complaint: serializeComplaint(complaint) });
  } catch (error) {
    return handleError(res, error);
  }
};
