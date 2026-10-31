// backend/src/controllers/applicationController.js
// ============================================================
// JOB APPLICATION — Phase 2 Job Marketplace
// Worker applies to a JobPost; Employer manages applications and
// can send an Offer (reusing the existing Offer flow — never a
// direct Hire creation).
//
// Security invariants:
// - workerId / employerId are ALWAYS derived server-side
//   (req.userId / JobPost.employerId), never from the request body.
// - Worker ownership enforced for withdraw; Employer ownership
//   enforced for status updates, applicant listing, and send-offer.
// - No email / phone / payout / earnings / private docs exposed.
// - Duplicate apply is atomic-safe via @@unique([jobPostId, workerId]).
// - Send-offer is race/idempotency safe: one JobApplication can
//   produce at most ONE Offer (offerId claim guard).
// ============================================================
import prisma from '../lib/prisma.js';
import {
  createNotification,
  NOTIFICATION_TYPES,
} from '../services/notificationService.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';
import { createOffer, validateOfferMonetaryInput } from '../services/offerService.js';
import { normalizeCurrencyCode } from '../utils/currencyMetadata.js';

import User from '../models/User.js';
import { getPublicVerification } from '../services/profileVerificationService.js';
import {
  uploadVerificationDocument,
  generateSignedDocumentUrl,
  generatePrivateDownloadUrl,
  deleteVerificationDocument
} from '../utils/verificationDocumentUpload.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';
import { ensureWorkerProfile } from '../services/workerProfileService.js';
import { getSupportedCountryByCode } from '../utils/supportedCountries.js';
import { withRegistrationGeography } from '../services/registrationGeographyService.js';
import { sendVerificationOnRegistration } from '../services/verificationService.js';
import { sanitizeUserResponse } from '../utils/safeUserResponse.js';
import { enrichUserResponse } from '../utils/userResponse.js';
import { isCanonicalWorkerJob } from '../constants/jobOptions.js';
import { resolveAccountDefaultCurrency } from '../utils/currencyMetadata.js';
import { detectPlatform, extractAppVersion } from '../services/platformDetectionService.js';
import { validatePhone } from './authController.js';

const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
};

// Rate limiting for public visitor registrations (in-memory bucket)
const publicRegisterAttempts = new Map();
const PUBLIC_REG_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const PUBLIC_REG_MAX_ATTEMPTS = 5;

const isPublicRegisterRateLimited = (ip) => {
  if (!ip) return false;
  const now = Date.now();
  const record = publicRegisterAttempts.get(ip);
  if (!record || now - record.firstAttemptAt > PUBLIC_REG_WINDOW_MS) {
    publicRegisterAttempts.set(ip, { count: 1, firstAttemptAt: now });
    return false;
  }
  record.count += 1;
  return record.count > PUBLIC_REG_MAX_ATTEMPTS;
};

export const isValidIanaTimeZone = (tz) => {
  if (!tz || typeof tz !== 'string') return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
};

export const isValidCalendarDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

export const isAppointmentInPast = (dateStr, timeStr, timeZone) => {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    let utc = Date.UTC(year, month - 1, day, hour, minute);
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    });
    for (let i = 0; i < 3; i++) {
      const parts = fmt.formatToParts(new Date(utc));
      const p = {};
      parts.forEach(x => { p[x.type] = x.value; });
      const tzYear = Number(p.year);
      const tzMonth = Number(p.month);
      const tzDay = Number(p.day);
      let tzHour = Number(p.hour);
      if (tzHour === 24) tzHour = 0;
      const tzMin = Number(p.minute);
      const asUtc = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMin);
      const diff = asUtc - Date.UTC(year, month - 1, day, hour, minute);
      if (diff === 0) break;
      utc -= diff;
    }
    return utc <= Date.now();
  } catch {
    return false;
  }
};

const MAX_COVER_MESSAGE_LENGTH = 2000;

// Allowed application status transitions
const WORKER_WITHDRAWABLE = new Set(['applied', 'shortlisted']);
const EMPLOYER_TRANSITIONS = {
  applied: new Set(['shortlisted', 'rejected']),
  shortlisted: new Set(['rejected']),
};

// ============================================================
// SAFE EMPLOYER DISPLAY DATA (no email/phone/private fields)
// Batched: one User query + one EmployerProfile query for all ids.
// ============================================================
const buildSafeEmployerMap = async (employerIds) => {
  const uniqueIds = [...new Set((employerIds || []).map((id) => String(id)).filter(Boolean))];
  const map = new Map();

  if (uniqueIds.length === 0) return map;

  try {
    const [users, profiles] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true, fullName: true, city: true },
      }),
      prisma.employerProfile.findMany({
        where: { userId: { in: uniqueIds } },
        select: { userId: true, companyName: true, industry: true },
      }),
    ]);

    const userMap = new Map(users.map((u) => [String(u.id), u]));
    const profileMap = new Map(profiles.map((p) => [String(p.userId), p]));
    const activePremiumIds = await getActivePremiumUserIds(uniqueIds);

    for (const id of uniqueIds) {
      const user = userMap.get(id);
      const profile = profileMap.get(id);
      map.set(id, {
        id,
        fullName: user?.fullName || null,
        city: user?.city || null,
        companyName: profile?.companyName || null,
        industry: profile?.industry || null,
        isPremium: activePremiumIds.has(id),
      });
    }
  } catch (error) {
    console.error('Applications: employer info lookup failed:', error.message);
    for (const id of uniqueIds) {
      map.set(id, { id, fullName: null, city: null, companyName: null, industry: null });
    }
  }

  return map;
};

// ============================================================

// Helper: Raw Mongo fetch for an application by ID to read decision & attendanceDetails
const getRawJobApplication = async (applicationId) => {
  try {
    const rawResult = await prisma.$runCommandRaw({
      find: 'job_applications',
      filter: { _id: { $oid: String(applicationId) } },
      limit: 1,
    });
    return rawResult?.cursor?.firstBatch?.[0] || null;
  } catch (err) {
    console.error('Applications: raw find error:', err.message);
    return null;
  }
};

// Helper: Raw Mongo fetch for applications by IDs
const getRawJobApplicationsMap = async (applicationIds) => {
  const map = new Map();
  if (!applicationIds || applicationIds.length === 0) return map;
  try {
    const oids = applicationIds.map(id => ({ $oid: String(id) }));
    const rawResult = await prisma.$runCommandRaw({
      find: 'job_applications',
      filter: { _id: { $in: oids } },
      limit: applicationIds.length,
    });
    const docs = rawResult?.cursor?.firstBatch || [];
    for (const doc of docs) {
      const id = String(doc._id?.$oid || doc._id);
      map.set(id, doc);
    }
  } catch (err) {
    console.error('Applications: raw batch find error:', err.message);
  }
  return map;
};


// Helper: safely fix UTF-8 filename encoding if multer parsed non-ASCII as latin1
const fixMulterEncoding = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  try {
    const fixed = Buffer.from(filename, 'latin1').toString('utf8');
    if (fixed && !fixed.includes('\uFFFD') && /[\u0600-\u06FF\u0400-\u04FF\u00C0-\u024F]/.test(fixed)) {
      return fixed;
    }
  } catch {}
  return filename;
};

// Helper: process optional CV file upload using the existing Cloudinary upload mechanism
const processCvUpload = async (file) => {
  if (!file || !file.buffer) return null;
  const decodedOriginalName = fixMulterEncoding(file.originalname) || file.originalname || 'cv.pdf';
  const uploadResult = await uploadVerificationDocument(file.buffer, {
    mimetype: file.mimetype,
    originalFilename: decodedOriginalName,
  });
  return {
    cvPublicId: uploadResult.public_id,
    cvResourceType: uploadResult.resource_type || 'image',
    cvOriginalName: decodedOriginalName,
  };
};

// ============================================================
// A) POST /api/jobs/:id/apply — WORKER only (supports optional CV)
// ============================================================
export const applyToJob = async (req, res) => {
  try {
    const jobPostId = String(req.params.id);
    if (!isValidObjectId(jobPostId)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // coverMessage optional, max 2000 chars
    let coverMessage = null;
    if (req.body.coverMessage !== undefined && req.body.coverMessage !== null) {
      if (typeof req.body.coverMessage !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'coverMessage must be a string',
        });
      }
      coverMessage = req.body.coverMessage.trim();
      if (coverMessage.length === 0) coverMessage = null;
      if (coverMessage && coverMessage.length > MAX_COVER_MESSAGE_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `coverMessage cannot exceed ${MAX_COVER_MESSAGE_LENGTH} characters`,
        });
      }
    }

    // Resolve WorkerProfile from authenticated worker identity
    const workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: String(req.userId) },
      select: { id: true },
    });
    if (!workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found. Please complete your worker profile first.',
      });
    }

    // JobPost must exist and be open
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      select: { id: true, employerId: true, status: true, expiresAt: true, deadline: true },
    });
    if (!jobPost) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (jobPost.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }
    const now = new Date();
    if (jobPost.expiresAt && new Date(jobPost.expiresAt).getTime() <= now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'This job has expired and is no longer accepting applications',
      });
    }
    if (jobPost.deadline && new Date(jobPost.deadline).getTime() <= now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline has passed',
      });
    }

    // Optional CV upload
    let cvData = null;
    if (req.file) {
      try {
        cvData = await processCvUpload(req.file);
      } catch (uploadError) {
        console.error('Applications: CV upload failed:', uploadError.message);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload CV. Please ensure the file is a valid PDF or image (max 10MB).',
        });
      }
    }

    // employerId always derived from JobPost — never from request body
    const application = await prisma.jobApplication.create({
      data: {
        jobPostId,
        workerId: String(req.userId),
        workerProfileId: workerProfile.id,
        employerId: jobPost.employerId,
        coverMessage,
      },
    });

    // If CV was uploaded, store CV metadata in raw MongoDB doc
    if (cvData) {
      try {
        await prisma.$runCommandRaw({
          findAndModify: 'job_applications',
          query: { _id: { $oid: application.id } },
          update: {
            $set: {
              cvPublicId: cvData.cvPublicId,
              cvResourceType: cvData.cvResourceType,
              cvOriginalName: cvData.cvOriginalName,
            },
          },
        });
      } catch (rawError) {
        console.error('Applications: CV raw metadata save error:', rawError.message);
      }
    }

    // Notify the employer
    try {
      const workerUser = await prisma.user.findUnique({
        where: { id: String(req.userId) },
        select: { fullName: true },
      });
      await createNotification(jobPost.employerId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'New Job Application',
        message: `${workerUser?.fullName || 'A worker'} applied to your job`,
        entityType: 'JOB_APPLICATION',
        entityId: application.id,
        link: '/employer-jobs',
      });
    } catch (notifError) {
      console.error('Applications: employer notification failed:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });

    // Push notification is automatically delivered via PushOutbox linked to createNotification above.
  } catch (error) {
    // Duplicate application — rely on @@unique([jobPostId, workerId])
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }
    console.error('Applications: apply error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

// ============================================================
// A2) POST /api/jobs/:id/apply-public — Unauthenticated visitor OR existing worker
// ============================================================
export const applyPublicToJob = async (req, res) => {
  try {
    const jobPostId = String(req.params.id);
    if (!isValidObjectId(jobPostId)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify job exists and is open
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      select: { id: true, employerId: true, status: true, expiresAt: true, deadline: true, jobTitle: true },
    });
    if (!jobPost) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (jobPost.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }
    const now = new Date();
    if (jobPost.expiresAt && new Date(jobPost.expiresAt).getTime() <= now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'This job has expired and is no longer accepting applications',
      });
    }
    if (jobPost.deadline && new Date(jobPost.deadline).getTime() <= now.getTime()) {
      return res.status(400).json({
        success: false,
        message: 'The application deadline has passed',
      });
    }

    // If caller is already authenticated
    if (req.userId) {
      if (req.userRole !== 'WORKER') {
        return res.status(403).json({
          success: false,
          message: 'Only workers can apply for jobs',
        });
      }
      return applyToJob(req, res);
    }

    // Visitor registration & application validation
    // Rate limit public registration attempts
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip;
    if (isPublicRegisterRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        message: 'Too many registration attempts. Please try again later.',
      });
    }

    const {
      email,
      password,
      confirmPassword,
      fullName,
      phone,
      countryCode,
      coverMessage,
    } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'A valid email address is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    if (confirmPassword && confirmPassword !== password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      return res.status(400).json({ success: false, message: phoneError });
    }
    const trimmedPhone = String(phone).trim();

    if (!countryCode || !String(countryCode).trim()) {
      return res.status(400).json({ success: false, message: 'Country is required' });
    }

    const normalizedCountryCode = String(countryCode).trim().toUpperCase();
    const matchedCountry = getSupportedCountryByCode(normalizedCountryCode);
    if (!matchedCountry) {
      return res.status(400).json({ success: false, message: 'Please select a valid supported country' });
    }

    // Check if account already exists — do NOT silently attach!
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'ACCOUNT_EXISTS',
        message: 'An account with this email already exists. Please log in to apply.',
      });
    }

    // Process optional CV upload
    let cvData = null;
    if (req.file) {
      try {
        cvData = await processCvUpload(req.file);
      } catch (uploadError) {
        console.error('Applications: CV upload failed:', uploadError.message);
        return res.status(400).json({
          success: false,
          message: 'Failed to upload CV. Please ensure the file is a valid PDF or image (max 10MB).',
        });
      }
    }

    // Hash password & create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User(withRegistrationGeography(req, {
      fullName: fullName.trim(),
      email: trimmedEmail,
      password: hashedPassword,
      role: 'WORKER',
      phone: trimmedPhone,
      countryCode: matchedCountry.code,
      countryName: matchedCountry.name,
      location: '',
      desiredJob: 'other',
      hourlyRate: '0',
      hourlyRateCurrency: resolveAccountDefaultCurrency({
        countryCode: matchedCountry.code,
        countryName: matchedCountry.name,
      }),
      profileComplete: false,
      lastPlatform: detectPlatform(req),
      lastActiveAt: new Date(),
      ...(extractAppVersion(req) ? { lastAppVersion: extractAppVersion(req) } : {}),
    }));

    await user.save();

    // Create canonical WorkerProfile
    let workerProfile;
    try {
      workerProfile = await ensureWorkerProfile(user);
    } catch (profileErr) {
      console.error('Applications: ensureWorkerProfile failed after user save:', profileErr.message);
    }

    // Issue auth token for visitor
    const token = jwt.sign(
      { userId: user._id, role: user.role, tokenVersion: user.tokenVersion || 0 },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    // Send verification email non-blocking
    try {
      sendVerificationOnRegistration(user);
    } catch (verifErr) {
      console.error('Applications: verification email failed:', verifErr.message);
    }

    // Create JobApplication
    let sanitizedCoverMessage = null;
    if (coverMessage && typeof coverMessage === 'string') {
      const trimmed = coverMessage.trim();
      if (trimmed.length > 0) {
        sanitizedCoverMessage = trimmed.slice(0, MAX_COVER_MESSAGE_LENGTH);
      }
    }

    let application = null;
    try {
      application = await prisma.jobApplication.create({
        data: {
          jobPostId,
          workerId: String(user._id),
          workerProfileId: workerProfile?.id || String(user._id),
          employerId: jobPost.employerId,
          coverMessage: sanitizedCoverMessage,
        },
      });
    } catch (appCreateErr) {
      console.error('Applications: JobApplication.create failed after account created:', appCreateErr);
      if (cvData?.cvPublicId) {
        deleteVerificationDocument(cvData.cvPublicId, cvData.cvResourceType).catch(() => {});
      }
      const userData = sanitizeUserResponse(user.toObject());
      userData.id = userData._id;
      delete userData.password;
      delete userData._id;
      return res.status(201).json({
        success: false,
        error: 'ACCOUNT_CREATED_APPLICATION_FAILED',
        message: appCreateErr.code === 'P2002'
          ? 'Account created, but you have already applied to this job.'
          : 'Your account was created, but we could not submit your application. Please log in to complete your application.',
        token,
        user: enrichUserResponse(userData),
        needsProfileCompletion: true,
      });
    }

    // Save CV metadata if uploaded
    if (cvData) {
      try {
        await prisma.$runCommandRaw({
          findAndModify: 'job_applications',
          query: { _id: { $oid: application.id } },
          update: {
            $set: {
              cvPublicId: cvData.cvPublicId,
              cvResourceType: cvData.cvResourceType,
              cvOriginalName: cvData.cvOriginalName,
            },
          },
        });
      } catch (rawError) {
        console.error('Applications: CV raw metadata save error:', rawError.message);
      }
    }

    // Notify the employer
    try {
      await createNotification(jobPost.employerId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: 'New Job Application',
        message: `${user.fullName} applied to your job (${jobPost.jobTitle})`,
        entityType: 'JOB_APPLICATION',
        entityId: application.id,
        link: '/employer-jobs',
      });
    } catch (notifError) {
      console.error('Applications: employer notification failed:', notifError.message);
    }

    const userData = sanitizeUserResponse(user.toObject());
    userData.id = userData._id;
    delete userData.password;
    delete userData._id;

    res.status(201).json({
      success: true,
      message: 'Account created and application submitted successfully',
      token,
      user: enrichUserResponse(userData),
      application,
      needsProfileCompletion: true,
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }
    console.error('Applications: apply-public error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

// ============================================================
// B) GET /api/jobs/applications/mine — WORKER only
// ============================================================
export const getMyApplications = async (req, res) => {
  try {
    const applications = await prisma.jobApplication.findMany({
      where: { workerId: String(req.userId) },
      orderBy: { createdAt: 'desc' },
    });

    if (applications.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    // Batch fetch JobPosts
    const jobPostIds = [...new Set(applications.map((a) => String(a.jobPostId)))];
    const jobPosts = await prisma.jobPost.findMany({
      where: { id: { in: jobPostIds } },
    });
    const jobPostMap = new Map(jobPosts.map((j) => [String(j.id), j]));

    // Batch fetch safe employer info
    const employerIds = [...new Set(applications.map((a) => String(a.employerId)))];
    const employerMap = await buildSafeEmployerMap(employerIds);

    // Batch fetch raw Mongo docs for decision and attendanceDetails
    const applicationIds = applications.map(a => String(a.id));
    const rawDocsMap = await getRawJobApplicationsMap(applicationIds);

    const enriched = applications.map((app) => {
      const jobPost = jobPostMap.get(String(app.jobPostId)) || null;
      const rawDoc = rawDocsMap.get(String(app.id)) || {};
      const decision = rawDoc.decision || (app.status === 'rejected' ? 'rejected' : (app.status === 'shortlisted' ? 'accepted' : app.status));
      const attendanceDetails = rawDoc.attendanceDetails || null;

      let cvUrl = null;
      const cvOriginalName = fixMulterEncoding(rawDoc.cvOriginalName) || rawDoc.cvOriginalName || null;
      if (rawDoc.cvPublicId) {
        cvUrl = `/api/jobs/applications/${app.id}/cv`;
      }

      return {
        ...app,
        decision,
        attendanceDetails,
        cvUrl,
        cvOriginalName,
        jobPost: jobPost
          ? {
              id: jobPost.id,
              jobTitle: jobPost.jobTitle,
              description: jobPost.description,
              location: jobPost.location,
              salaryMin: jobPost.salaryMin,
              salaryMax: jobPost.salaryMax,
              compensationCurrency: jobPost.compensationCurrency,
              employmentType: jobPost.employmentType,
              contractType: jobPost.contractType,
              status: jobPost.status,
              createdAt: jobPost.createdAt,
            }
          : null,
        employer: employerMap.get(String(app.employerId)) || null,
      };
    });

    res.json({ success: true, applications: enriched });
  } catch (error) {
    console.error('Applications: my applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to load your applications' });
  }
};

// ============================================================
// C) PATCH /api/jobs/applications/:id/withdraw — WORKER owner only
// ============================================================
export const withdrawApplication = async (req, res) => {
  try {
    const applicationId = String(req.params.id);
    if (!isValidObjectId(applicationId)) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Worker ownership enforced
    if (String(application.workerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Only applied/shortlisted can be withdrawn
    if (!WORKER_WITHDRAWABLE.has(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Application in status "${application.status}" cannot be withdrawn`,
      });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'withdrawn' },
    });

    res.json({ success: true, message: 'Application withdrawn', application: updated });
  } catch (error) {
    console.error('Applications: withdraw error:', error);
    res.status(500).json({ success: false, message: 'Failed to withdraw application' });
  }
};

// ============================================================
// D) GET /api/jobs/:id/applications — EMPLOYER owner only
// ============================================================
export const getJobApplications = async (req, res) => {
  try {
    const jobPostId = String(req.params.id);
    if (!isValidObjectId(jobPostId)) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const jobPost = await prisma.jobPost.findUnique({
      where: { id: jobPostId },
      select: {
        id: true,
        employerId: true,
        salaryMin: true,
        salaryMax: true,
        compensationCurrency: true,
      },
    });
    if (!jobPost) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Employer ownership enforced
    if (String(jobPost.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const applications = await prisma.jobApplication.findMany({
      where: { jobPostId },
      orderBy: { createdAt: 'desc' },
    });

    if (applications.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    // ============================================================
    // BATCHED LOOKUPS (no N+1)
    // ============================================================
    const workerProfileIds = [...new Set(applications.map((a) => String(a.workerProfileId)))];
    const workerUserIds = [...new Set(applications.map((a) => String(a.workerId)))];

    const [workerProfiles, workerUsers, premiumUserIds, mongooseUsers] = await Promise.all([
      prisma.workerProfile.findMany({
        where: { id: { in: workerProfileIds } },
        select: {
          id: true,
          userId: true,
          experienceYears: true,
          expectedSalary: true,
          availability: true,
          activelyLooking: true,
          skills: true,
          profilePhotoUrl: true,
          ratingAvg: true,
        },
      }),
      prisma.user.findMany({
        where: { id: { in: workerUserIds } },
        select: {
          id: true,
          fullName: true,
          profileImage: true,
          city: true,
          desiredJob: true,
          skills: true,
          experience: true,
        },
      }),
      getActivePremiumUserIds(workerUserIds),
      User.find({ _id: { $in: workerUserIds } }),
    ]);

    const profileMap = new Map(workerProfiles.map((p) => [String(p.id), p]));
    const userMap = new Map(workerUsers.map((u) => [String(u.id), u]));
    const mongooseUserMap = new Map(mongooseUsers.map((u) => [String(u._id), u]));
    const rawDocsMap = await getRawJobApplicationsMap(applications.map(a => String(a.id)));

    const enriched = applications.map((app) => {
      const profile = profileMap.get(String(app.workerProfileId)) || null;
      const user = userMap.get(String(app.workerId)) || null;
      const isPremium = premiumUserIds.has(String(app.workerId));
      const isAvailable = (profile?.availability || 'available') === 'available';
      // Effective "Actively Looking": ONLY when available AND Premium AND stored true.
      const effectiveActivelyLooking = isAvailable && isPremium && profile?.activelyLooking === true;
      const mongooseUser = mongooseUserMap.get(String(app.workerId));

      const rawDoc = rawDocsMap.get(String(app.id)) || {};
      const decision = rawDoc.decision || (app.status === 'rejected' ? 'rejected' : (app.status === 'shortlisted' ? 'accepted' : app.status));
      const attendanceDetails = rawDoc.attendanceDetails || null;
      let cvUrl = null;
      const cvOriginalName = fixMulterEncoding(rawDoc.cvOriginalName) || rawDoc.cvOriginalName || null;
      if (rawDoc.cvPublicId) {
        cvUrl = `/api/jobs/applications/${app.id}/cv`;
      }

      return {
        id: app.id,
        jobPostId: app.jobPostId,
        status: app.status,
        decision,
        attendanceDetails,
        cvUrl,
        cvOriginalName,
        coverMessage: app.coverMessage,
        offerId: app.offerId || null,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        jobPost: {
          id: jobPost.id,
          salaryMin: jobPost.salaryMin,
          salaryMax: jobPost.salaryMax,
          compensationCurrency: jobPost.compensationCurrency,
        },
        worker: {
          id: user?.id || String(app.workerId),
          workerProfileId: profile?.id || String(app.workerProfileId),
          fullName: user?.fullName || null,
          profileImage: user?.profileImage || profile?.profilePhotoUrl || null,
          city: user?.city || null,
          desiredJob: user?.desiredJob || null,
          skills: profile?.skills?.length ? profile.skills : user?.skills || [],
          experience: user?.experience || null,
          experienceYears: profile?.experienceYears ?? null,
          expectedSalary: profile?.expectedSalary ?? null,
          availability: profile?.availability || 'available',
          ratingAvg: profile?.ratingAvg ?? null,
          isPremium,
          activelyLooking: effectiveActivelyLooking,
          verification: getPublicVerification(mongooseUser),
        },
      };
    });

    res.json({ success: true, applications: enriched });
  } catch (error) {
    console.error('Applications: job applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to load applications' });
  }
};

// ============================================================
// E) PATCH /api/jobs/applications/:id/status — EMPLOYER owner only
// Supports:
// - status: 'accepted' (requires interviewDate, interviewTime, interviewAddress)
// - status: 'rejected'
// - status: 'shortlisted' (legacy transition)
// ============================================================
export const updateApplicationStatus = async (req, res) => {
  try {
    const applicationId = String(req.params.id);
    if (!isValidObjectId(applicationId)) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { status, interviewDate, interviewTime, interviewTimeZone, interviewAddress, notes } = req.body;
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Employer ownership enforced
    if (String(application.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Handle 'accepted' status
    if (status === 'accepted') {
      if (!interviewDate || typeof interviewDate !== 'string' || interviewDate.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Interview date is required to accept an application',
        });
      }
      const trimmedDate = interviewDate.trim();
      if (!isValidCalendarDate(trimmedDate)) {
        return res.status(400).json({
          success: false,
          message: 'Interview date must be a valid calendar date in YYYY-MM-DD format',
        });
      }

      if (!interviewTime || typeof interviewTime !== 'string' || interviewTime.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Interview time is required to accept an application',
        });
      }
      const trimmedTime = interviewTime.trim();
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmedTime)) {
        return res.status(400).json({
          success: false,
          message: 'Interview time must be in HH:mm 24-hour format (e.g. 14:30)',
        });
      }

      if (!interviewTimeZone || typeof interviewTimeZone !== 'string' || !isValidIanaTimeZone(interviewTimeZone)) {
        return res.status(400).json({
          success: false,
          message: 'A valid IANA time zone is required (e.g. Africa/Cairo, Asia/Riyadh, UTC)',
        });
      }
      const trimmedTimeZone = interviewTimeZone.trim();

      if (isAppointmentInPast(trimmedDate, trimmedTime, trimmedTimeZone)) {
        return res.status(400).json({
          success: false,
          message: 'Interview appointment cannot be scheduled in the past',
        });
      }

      if (!interviewAddress || typeof interviewAddress !== 'string' || interviewAddress.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Interview address is required to accept an application',
        });
      }

      // Ensure application is in an acceptable state
      if (!['applied', 'shortlisted'].includes(application.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot accept an application in status "${application.status}"`,
        });
      }

      const attendanceDetails = {
        date: trimmedDate,
        time: trimmedTime,
        timeZone: trimmedTimeZone,
        address: interviewAddress.trim(),
        notes: (notes && typeof notes === 'string') ? notes.trim() : null,
        scheduledAt: new Date().toISOString(),
      };

      // Atomically update MongoDB collection: set decision: 'accepted' & attendanceDetails,
      // and keep Prisma status as 'shortlisted' so Prisma client enum remains fully valid
      await prisma.$runCommandRaw({
        findAndModify: 'job_applications',
        query: { _id: { $oid: applicationId } },
        update: {
          $set: {
            decision: 'accepted',
            status: 'shortlisted',
            attendanceDetails,
          },
        },
      });

      const updated = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
      });

      // Notify the worker
      try {
        const jobPost = await prisma.jobPost.findUnique({
          where: { id: application.jobPostId },
          select: { jobTitle: true },
        });
        await createNotification(application.workerId, {
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Application Accepted: Interview Scheduled',
          message: `Your application for "${jobPost?.jobTitle || 'the job'}" was accepted! You are invited for an interview on ${attendanceDetails.date} at ${attendanceDetails.time} (${attendanceDetails.timeZone}).`,
          entityType: 'JOB_APPLICATION',
          entityId: application.id,
          link: '/worker/offers',
        });
      } catch (notifError) {
        console.error('Applications: worker accept notification failed:', notifError.message);
      }

      // Push notification is automatically delivered via PushOutbox linked to createNotification above.

      return res.json({
        success: true,
        message: 'Application accepted and interview details saved',
        application: {
          ...updated,
          decision: 'accepted',
          attendanceDetails,
        },
      });
    }

    // Handle 'rejected' status
    if (status === 'rejected') {
      await prisma.$runCommandRaw({
        findAndModify: 'job_applications',
        query: { _id: { $oid: applicationId } },
        update: {
          $set: {
            decision: 'rejected',
            status: 'rejected',
          },
        },
      });

      const updated = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
      });

      try {
        const jobPost = await prisma.jobPost.findUnique({
          where: { id: application.jobPostId },
          select: { jobTitle: true },
        });
        await createNotification(application.workerId, {
          type: NOTIFICATION_TYPES.SYSTEM,
          title: 'Application Update',
          message: `Your application for "${jobPost?.jobTitle || 'the job'}" was not selected`,
          entityType: 'JOB_APPLICATION',
          entityId: application.id,
          link: '/worker-applications',
        });
      } catch (notifError) {
        console.error('Applications: worker reject notification failed:', notifError.message);
      }

      // Push notification is automatically delivered via PushOutbox linked to createNotification above.

      return res.json({
        success: true,
        message: 'Application rejected',
        application: {
          ...updated,
          decision: 'rejected',
        },
      });
    }

    // Allowed standard transitions
    const allowed = EMPLOYER_TRANSITIONS[application.status];
    if (!allowed || !allowed.has(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition application from "${application.status}" to "${status}"`,
      });
    }

    const updated = await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status },
    });

    // Notify worker
    try {
      const jobPost = await prisma.jobPost.findUnique({
        where: { id: application.jobPostId },
        select: { jobTitle: true },
      });
      const actionLabel = status === 'shortlisted' ? 'shortlisted' : 'rejected';
      await createNotification(application.workerId, {
        type: NOTIFICATION_TYPES.SYSTEM,
        title: status === 'shortlisted' ? 'Application Shortlisted' : 'Application Rejected',
        message: `Your application for "${jobPost?.jobTitle || 'the job'}" was ${actionLabel}`,
        entityType: 'JOB_APPLICATION',
        entityId: application.id,
        link: '/worker-applications',
      });
    } catch (notifError) {
      console.error('Applications: worker notification failed:', notifError.message);
    }

    res.json({ success: true, message: `Application ${status}`, application: updated });

    // Push notification is automatically delivered via PushOutbox linked to createNotification above.
  } catch (error) {
    console.error('Applications: status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update application status' });
  }
};

// ============================================================
// F) POST /api/jobs/applications/:id/send-offer — EMPLOYER owner only
// Reuses the shared Offer creation service (never creates a Hire
// directly). Race/idempotency safe via the application.offerId claim:
//   - If application.offerId is already set, return the existing offer
//     (idempotent) — no duplicate Offer is ever created.
//   - Otherwise create the Offer, then atomically claim the application
//     with updateMany({ where: { id, offerId: null, status in [...] } }).
//   - If the claim fails (count 0), another request won the race: delete
//     the orphan Offer and return the winner's offerId.
//   - If Offer creation fails, the application is never claimed, so the
//     attempt remains recoverable/retryable.
// ============================================================
export const sendOfferFromApplication = async (req, res) => {
  try {
    const applicationId = String(req.params.id);
    if (!isValidObjectId(applicationId)) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Employer ownership enforced
    if (String(application.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Idempotency: if an Offer was already created for this application,
    // return the existing offerId — never create a duplicate.
    if (application.offerId) {
      return res.status(200).json({
        success: true,
        message: 'An offer has already been sent for this application',
        application,
        offerId: application.offerId,
      });
    }

    // Application must be applied or shortlisted
    if (!['applied', 'shortlisted'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot send an offer for an application in status "${application.status}"`,
      });
    }

    // Fetch JobPost and validate salary range
    const jobPost = await prisma.jobPost.findUnique({
      where: { id: application.jobPostId },
    });
    if (!jobPost) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    if (String(jobPost.employerId) !== String(req.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Policy A: the owned Job is the authoritative currency boundary.
    // Legacy currency-less Jobs resolve to EGP for this new Offer only.
    const offerCurrency = jobPost.compensationCurrency || 'EGP';
    if (req.body.compensationCurrency !== undefined
      && normalizeCurrencyCode(req.body.compensationCurrency) !== offerCurrency) {
      return res.status(400).json({
        success: false,
        message: 'Offer compensationCurrency must match the Job compensation currency',
      });
    }

    const monetary = validateOfferMonetaryInput({
      salary: req.body.agreedSalary,
      compensationCurrency: offerCurrency,
    });
    const agreedSalary = monetary.salary;

    if (jobPost.salaryMin != null && agreedSalary < jobPost.salaryMin) {
      return res.status(400).json({
        success: false,
        message: `agreedSalary must be at least ${jobPost.salaryMin}`,
      });
    }
    if (jobPost.salaryMax != null && agreedSalary > jobPost.salaryMax) {
      return res.status(400).json({
        success: false,
        message: `agreedSalary cannot exceed ${jobPost.salaryMax}`,
      });
    }

    // ============================================================
    // REUSE SHARED OFFER CREATION SERVICE
    // Mirrors hireController.sendOffer: creates an Offer record
    // (status 'pending'), NOT a Hire. The worker accepts the Offer
    // through the existing /api/hires/offer/:offerId/respond flow,
    // which creates the Hire + 15% commission + payment/contact flow.
    //
    // NOTE: application.coverMessage is the WORKER's text and is NOT
    // mapped into Offer.message (which is Employer-side text). Offer
    // message stays null here.
    // ============================================================
    const [workerProfile, workerUser, employerUser] = await Promise.all([
      prisma.workerProfile.findUnique({
        where: { id: application.workerProfileId },
      }),
      prisma.user.findUnique({
        where: { id: application.workerId },
        select: { id: true, fullName: true, city: true, profileImage: true },
      }),
      prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, fullName: true },
      }),
    ]);

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found' });
    }

    const offer = await createOffer({
      employerId: req.userId,
      workerProfileId: workerProfile.id,
      jobTitle: jobPost.jobTitle,
      salary: agreedSalary,
      compensationCurrency: offerCurrency,
      jobPostId: application.jobPostId,
      applicationId: application.id,
      message: null, // Employer-side message only; never worker cover text
      workerName: workerUser?.fullName || null,
      workerEmail: null,
      workerPhone: null,
      workerLocation: workerUser?.city || null,
      workerRating: workerProfile.ratingAvg || null,
      workerSkills: workerProfile.skills || [],
      workerImage: workerUser?.profileImage || workerProfile.profilePhotoUrl || null,
      employerName: employerUser?.fullName || null,
      employerEmail: null,
      hourlyRate: null,
      amount: agreedSalary,
      description: jobPost.description || null,
      workingHoursPerDay: jobPost.workingHoursPerDay || null,
      workingDaysPerWeek: jobPost.workingDaysPerWeek || null,
      weeklyDaysOff: jobPost.weeklyDaysOff || null,
      workStartTime: jobPost.workStartTime || null,
      workEndTime: jobPost.workEndTime || null,
      employmentStartDate: jobPost.employmentStartDate || null,
      additionalNotes: null,
    });

    // ============================================================
    // ATOMIC CLAIM — race/idempotency guard.
    // Uses a raw MongoDB findAndModify (atomic) that matches documents
    // where offerId is null OR the field is MISSING (legacy applications
    // created before the offerId field was added to the schema). Prisma's
    // `offerId: null` filter only matches explicit null, NOT missing
    // fields, which would cause the claim to fail for legacy rows and
    // silently drop the created Offer. findAndModify is atomic: only one
    // concurrent request can successfully claim the application.
    // ============================================================
    const claimResult = await prisma.$runCommandRaw({
      findAndModify: 'job_applications',
      query: {
        _id: { $oid: applicationId },
        $or: [{ offerId: null }, { offerId: { $exists: false } }],
        status: { $in: ['applied', 'shortlisted'] },
      },
      update: {
        $set: {
          offerId: offer.id,
          status: 'offer_sent',
        },
        $currentDate: { updatedAt: true },
      },
      new: true,
    });

    if (!claimResult || !claimResult.value) {
      // Another request won the race — delete our orphan Offer and
      // return the winner's offerId (idempotent).
      try {
        await prisma.offer.delete({ where: { id: offer.id } });
      } catch (cleanupError) {
        console.error('Applications: orphan offer cleanup failed:', cleanupError.message);
      }

      const winner = await prisma.jobApplication.findUnique({
        where: { id: applicationId },
      });
      return res.status(200).json({
        success: true,
        message: 'An offer has already been sent for this application',
        application: winner,
        offerId: winner?.offerId || null,
      });
    }

    const updatedApplication = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });

    // Notify the worker (matches the existing sendOffer flow notification)
    try {
      await createNotification(workerProfile.userId, {
        type: NOTIFICATION_TYPES.NEW_HIRE,
        title: 'New Job Offer',
        message: `${employerUser?.fullName || 'An employer'} sent you a job offer for ${jobPost.jobTitle}`,
        entityType: 'OFFER',
        entityId: offer.id,
        link: '/worker/offers',
      });
    } catch (notifError) {
      console.error('Applications: offer notification failed:', notifError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Offer sent successfully',
      application: updatedApplication,
      offerId: offer.id,
    });

    // Push notification is automatically delivered via PushOutbox linked to createNotification above.
  } catch (error) {
    console.error('Applications: send offer error:', error);
    if (error?.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to send offer' });
  }
};

// ============================================================
// G) GET /api/jobs/applications/:id/cv — Authenticated CV download endpoint
// Accessible by:
//  - The employer who posted the job
//  - The worker who submitted the application
// ============================================================
export const downloadApplicationCv = async (req, res) => {
  try {
    const applicationId = String(req.params.id);
    if (!isValidObjectId(applicationId)) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const application = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Authorization check: must be either the employer or the applicant worker
    const userId = String(req.userId);
    const isEmployerOwner = String(application.employerId) === userId;
    const isWorkerOwner = String(application.workerId) === userId;

    if (!isEmployerOwner && !isWorkerOwner) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Retrieve raw MongoDB document to read cvPublicId, cvResourceType, cvOriginalName
    const rawResult = await prisma.$runCommandRaw({
      find: 'job_applications',
      filter: { _id: { $oid: applicationId } },
      limit: 1,
    });
    const rawDoc = rawResult?.cursor?.firstBatch?.[0];
    if (!rawDoc || !rawDoc.cvPublicId) {
      return res.status(404).json({ success: false, message: 'No CV found for this application' });
    }

    const { cvPublicId, cvResourceType = 'image' } = rawDoc;
    const rawOriginalName = fixMulterEncoding(rawDoc.cvOriginalName) || rawDoc.cvOriginalName || 'Applicant_CV.pdf';

    // Derive extension and format
    let ext = (rawOriginalName.split('.').pop() || '').toLowerCase();
    if (!ext || ext === rawOriginalName.toLowerCase()) {
      ext = cvResourceType === 'raw' ? 'pdf' : 'jpg';
    }

    // Format for Cloudinary download
    const format = ext;
    const downloadUrl = generatePrivateDownloadUrl(cvPublicId, cvResourceType, format, 3600);
    if (!downloadUrl) {
      return res.status(500).json({ success: false, message: 'Failed to generate download URL' });
    }

    // Fetch from Cloudinary upstream
    const upstreamRes = await fetch(downloadUrl);
    if (!upstreamRes.ok) {
      console.error(`CV upstream fetch failed (${upstreamRes.status}):`, downloadUrl);
      return res.status(502).json({
        success: false,
        message: 'Failed to retrieve document from storage provider'
      });
    }

    // Determine correct Content-Type
    const mimeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    };
    const contentType = mimeMap[ext] || upstreamRes.headers.get('content-type') || 'application/octet-stream';

    // Ensure safe filename with extension
    let safeFilename = rawOriginalName.replace(/[/\\?%*:|"<>]/g, '_').trim();
    if (!safeFilename.toLowerCase().endsWith(`.${ext}`)) {
      safeFilename += `.${ext}`;
    }

    // RFC 5987 / RFC 6266 Content-Disposition header with UTF-8 encoding support
    const asciiFallback = safeFilename.replace(/[^\x20-\x7E]/g, '_').replace(/"/g, '\\"');
    const utf8Encoded = encodeURIComponent(safeFilename).replace(/['()]/g, escape).replace(/\*/g, '%2A');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`);

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    // Stream response
    const arrayBuffer = await upstreamRes.arrayBuffer();
    return res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    console.error('Applications: CV download error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while downloading CV' });
  }
};
