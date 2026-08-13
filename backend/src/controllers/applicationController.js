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
import { createOffer } from '../services/offerService.js';

const isValidObjectId = (id) => {
  return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
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

    for (const id of uniqueIds) {
      const user = userMap.get(id);
      const profile = profileMap.get(id);
      map.set(id, {
        id,
        fullName: user?.fullName || null,
        city: user?.city || null,
        companyName: profile?.companyName || null,
        industry: profile?.industry || null,
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
// A) POST /api/jobs/:id/apply — WORKER only
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
      select: { id: true, employerId: true, status: true },
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

    // Batch fetch safe employer info (one User query + one EmployerProfile query)
    const employerIds = [...new Set(applications.map((a) => String(a.employerId)))];
    const employerMap = await buildSafeEmployerMap(employerIds);

    const enriched = applications.map((app) => {
      const jobPost = jobPostMap.get(String(app.jobPostId)) || null;
      return {
        ...app,
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

    const [workerProfiles, workerUsers, premiumUserIds] = await Promise.all([
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
    ]);

    const profileMap = new Map(workerProfiles.map((p) => [String(p.id), p]));
    const userMap = new Map(workerUsers.map((u) => [String(u.id), u]));

    const enriched = applications.map((app) => {
      const profile = profileMap.get(String(app.workerProfileId)) || null;
      const user = userMap.get(String(app.workerId)) || null;
      const isPremium = premiumUserIds.has(String(app.workerId));
      const isAvailable = (profile?.availability || 'available') === 'available';
      // Effective "Actively Looking": ONLY when available AND Premium AND stored true.
      const effectiveActivelyLooking = isAvailable && isPremium && profile?.activelyLooking === true;

      return {
        id: app.id,
        jobPostId: app.jobPostId,
        status: app.status,
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
// ============================================================
export const updateApplicationStatus = async (req, res) => {
  try {
    const applicationId = String(req.params.id);
    if (!isValidObjectId(applicationId)) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const { status } = req.body;
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

    // Allowed transitions only
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

    // Notify the worker
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

    const agreedSalary = Number(req.body.agreedSalary);
    if (!Number.isFinite(agreedSalary) || agreedSalary <= 0) {
      return res.status(400).json({
        success: false,
        message: 'agreedSalary must be a positive number',
      });
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
      amount: null,
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
  } catch (error) {
    console.error('Applications: send offer error:', error);
    res.status(500).json({ success: false, message: 'Failed to send offer' });
  }
};
