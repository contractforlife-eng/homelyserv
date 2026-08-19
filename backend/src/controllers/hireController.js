import prisma from '../lib/prisma.js';
import {
  createNotification as notificationServiceCreate,
  NOTIFICATION_TYPES,
} from '../services/notificationService.js';
import { RECRUITMENT_COMMISSION_RATE } from '../config/monetization.js';
import { ensureInitialWorkerEarning } from '../services/workerEarningService.js';
import { createOffer } from '../services/offerService.js';
import { addMoney, multiplyMoneyByDecimal, roundMoney } from '../utils/money.js';
import { getActivePremiumUserIds } from '../services/premiumService.js';
import { sendPushToUser } from '../services/fcmService.js';

const createNotification = async (userId, type, title, message) => {
  try {
    const notificationType =
      type === 'offer' ? NOTIFICATION_TYPES.NEW_HIRE : NOTIFICATION_TYPES.SYSTEM;

    await notificationServiceCreate(userId, {
      type: notificationType,
      title,
      message,
      entityType: 'OFFER',
      link: '/worker/offers',
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

const findOwnedWorkerProfile = async (userId) => prisma.workerProfile.findUnique({
  where: { userId: String(userId) },
  select: { id: true, userId: true },
});

// Recruitment commission rate comes from the single source of truth:
// backend/src/config/monetization.js (RECRUITMENT_COMMISSION_RATE = 15%).

// SEND JOB OFFER (creates an Offer record instead of Hire)
export const sendOffer = async (req, res) => {
  try {
    const {
      workerId,
      agreedSalary,
      startDate,
      jobTitle,
      message,
      workerName,
      workerEmail,
      workerPhone,
      workerLocation,
      workerRating,
      workerSkills,
      workerImage,
      employerName,
      employerEmail,
      hourlyRate,
      amount,
      compensationCurrency,
      description,
      workingHoursPerDay,
      workingDaysPerWeek,
      weeklyDaysOff,
      workStartTime,
      workEndTime,
      employmentStartDate,
      additionalNotes
    } = req.body;

    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    if (!isObjectId(workerId)) {
      return res.status(400).json({ message: 'Invalid worker target' });
    }

    const workerUser = await prisma.user.findUnique({
      where: { id: workerId },
      select: { id: true, role: true },
    });
    if (!workerUser) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    if (workerUser.role !== 'WORKER') {
      return res.status(400).json({ message: 'Offer target must be a Worker' });
    }

    let workerProfile = await prisma.workerProfile.findUnique({
      where: { userId: workerId }
    });
    if (!workerProfile) {
      workerProfile = await prisma.workerProfile.create({
        data: {
          userId: workerId,
          category: '',
          experienceYears: 0,
          expectedSalary: 0,
          availability: 'available',
          workType: 'full-time',
          bioAr: '',
          bioEn: '',
          skills: [],
          profilePhotoUrl: '',
          docStatus: 'pending',
          ratingAvg: 0,
          ratingCount: 0,
          isVisible: true
        }
      });
    }

    if (workerProfile.availability === 'unavailable') {
      return res.status(403).json({ message: 'Worker is currently unavailable for new hire opportunities' });
    }

    const offer = await createOffer({
      employerId: req.userId,
      workerProfileId: workerProfile.id,
      jobTitle,
      salary: agreedSalary,
      compensationCurrency,
      message: message || null,
      workerName: workerName || null,
      workerEmail: workerEmail || null,
      workerPhone: workerPhone || null,
      workerLocation: workerLocation || null,
      workerRating: workerRating ? parseFloat(workerRating) : null,
      workerSkills: workerSkills || [],
      workerImage: workerImage || null,
      employerName: employerName || null,
      employerEmail: employerEmail || null,
      hourlyRate,
      amount,
      description: description || null,
      workingHoursPerDay: workingHoursPerDay ? parseFloat(workingHoursPerDay) : null,
      workingDaysPerWeek: workingDaysPerWeek ? parseFloat(workingDaysPerWeek) : null,
      weeklyDaysOff: weeklyDaysOff ? String(weeklyDaysOff) : null,
      workStartTime: workStartTime || null,
      workEndTime: workEndTime || null,
      employmentStartDate: employmentStartDate ? new Date(employmentStartDate) : null,
      additionalNotes: additionalNotes || null,
    });

    await createNotification(
      workerProfile.userId,
      'offer',
      'New Job Offer',
      `${employerName || 'An employer'} sent you a job offer for ${jobTitle}`
    );

    res.status(201).json({ success: true, message: 'Offer sent successfully', offer });

    if (String(req.userId) !== String(workerProfile.userId)) {
      sendPushToUser(workerProfile.userId, {
        title: 'New job offer',
        body: 'You have received a new offer on HomelyServ',
        data: {
          type: 'NEW_OFFER',
          entityType: 'OFFER',
          offerId: String(offer.id),
        },
        channelId: 'jobs_offers',
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Hire error:', error);
    if (error?.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
};

// RESPOND TO OFFER (accept/reject)
// On accept: creates corresponding Hire record with all Offer details copied
export const respondToOffer = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Use "accepted" or "rejected"' });
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId }
    });

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const workerProfile = await findOwnedWorkerProfile(req.userId);
    if (!workerProfile || String(offer.workerId) !== String(workerProfile.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (offer.status === status) {
      if (status === 'accepted') {
        const existingHire = await prisma.hire.findFirst({ where: { offerId: offer.id } });
        if (!existingHire) {
          return res.status(409).json({ message: 'Accepted Offer has no Hire; manual recovery required' });
        }
        return res.json({ message: 'Offer already accepted', offer, hire: existingHire });
      }
      return res.json({ message: 'Offer already rejected', offer });
    }

    if (offer.status !== 'pending') {
      return res.status(409).json({ message: 'Offer has already been responded to' });
    }

    if (status === 'accepted') {
      const salary = offer.salary;
      const compensationCurrency = offer.compensationCurrency || 'EGP';
      const commission = multiplyMoneyByDecimal(salary, RECRUITMENT_COMMISSION_RATE, compensationCurrency);
      const vat = roundMoney(0, compensationCurrency);
      const total = addMoney([commission, vat], compensationCurrency);

      const reference = `HS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      let acceptance;
      try {
        acceptance = await prisma.$transaction(async (tx) => {
          const claim = await tx.offer.updateMany({
            where: { id: offer.id, workerId: workerProfile.id, status: 'pending' },
            data: { status: 'accepted' },
          });
          if (claim.count !== 1) {
            throw new Error('OFFER_ACCEPTANCE_CONFLICT');
          }

          const existingHire = await tx.hire.findFirst({ where: { offerId: offer.id } });
          const hire = existingHire || await tx.hire.create({
            data: {
              workerId: offer.workerId,
              employerId: offer.employerId,
              offerId: offer.id,
              compensationCurrency,
              agreedSalary: salary,
              commissionAmount: commission,
              vatAmount: vat,
              totalDue: total,
              paymentReference: reference,
              startDate: null,
              status: 'offer_sent',
              hourlyRate: offer.hourlyRate || null,
              workingHoursPerDay: offer.workingHoursPerDay || null,
              workingDaysPerWeek: offer.workingDaysPerWeek || null,
              weeklyDaysOff: offer.weeklyDaysOff || null,
              workStartTime: offer.workStartTime || null,
              workEndTime: offer.workEndTime || null,
              employmentStartDate: offer.employmentStartDate || null,
              additionalNotes: offer.additionalNotes || null
            }
          });

          const updatedOffer = await tx.offer.findUnique({ where: { id: offer.id } });
          return { offer: updatedOffer, hire };
        });
      } catch (transactionError) {
        const [currentOffer, existingHire] = await Promise.all([
          prisma.offer.findUnique({ where: { id: offer.id } }),
          prisma.hire.findFirst({ where: { offerId: offer.id } }),
        ]);
        if (currentOffer?.status === 'accepted' && existingHire) {
          return res.json({ message: 'Offer already accepted', offer: currentOffer, hire: existingHire });
        }
        if (transactionError.message === 'OFFER_ACCEPTANCE_CONFLICT') {
          return res.status(409).json({ message: 'Offer response is already being processed' });
        }
        throw transactionError;
      }

      console.log(`✅ Hire created: ${acceptance.hire.id} for Offer: ${offer.id}`);

      await createNotification(
        workerProfile.userId,
        'offer',
        'Offer Accepted',
        `You accepted the offer from ${offer.employerName || 'Employer'} for ${offer.jobTitle}`
      );

      res.json({ message: 'Offer accepted, Hire created', offer: acceptance.offer, hire: acceptance.hire });

      if (String(req.userId) !== String(offer.employerId)) {
        sendPushToUser(offer.employerId, {
          title: 'Offer accepted',
          body: 'Your offer has been accepted on HomelyServ',
          data: {
            type: 'OFFER_ACCEPTED',
            entityType: 'OFFER',
            offerId: String(offer.id),
          },
          channelId: 'jobs_offers',
        }).catch(() => {});
      }
    }

    const rejection = await prisma.offer.updateMany({
      where: { id: offer.id, workerId: workerProfile.id, status: 'pending' },
      data: { status: 'rejected' },
    });
    if (rejection.count !== 1) {
      const currentOffer = await prisma.offer.findUnique({ where: { id: offer.id } });
      if (currentOffer?.status === 'rejected') {
        return res.json({ message: 'Offer already rejected', offer: currentOffer });
      }
      return res.status(409).json({ message: 'Offer has already been responded to' });
    }

    const updatedOffer = await prisma.offer.findUnique({ where: { id: offer.id } });
    await createNotification(
      workerProfile.userId,
      'offer',
      'Offer Rejected',
      `You rejected the offer from ${offer.employerName || 'Employer'} for ${offer.jobTitle}`
    );

    res.json({ message: 'Offer rejected', offer: updatedOffer });

    if (String(req.userId) !== String(offer.employerId)) {
      sendPushToUser(offer.employerId, {
        title: 'Offer update',
        body: 'Your offer has been declined on HomelyServ',
        data: {
          type: 'OFFER_REJECTED',
          entityType: 'OFFER',
          offerId: String(offer.id),
        },
        channelId: 'jobs_offers',
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Respond to offer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY HIRES (backward compatible - returns array)
// Step 1: Fetch raw Hire records
// Step 2: For each Hire with an offerId, fetch the corresponding Offer
// Step 3: For each Hire, fetch the WorkerProfile and User to get worker identity
// Step 4: Merge all data into a single enriched object per hire
export const getMyHires = async (req, res) => {
  try {
    let hires;

    if (req.userRole === 'EMPLOYER') {
      hires = await prisma.hire.findMany({
        where: { employerId: req.userId },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const profile = await prisma.workerProfile.findUnique({ where: { userId: req.userId } });
      if (!profile) return res.json([]);
      hires = await prisma.hire.findMany({
        where: { workerId: profile.id },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!hires || hires.length === 0) {
      return res.json([]);
    }

    // Step 2: Fetch related Offers for all hires that have an offerId
    const offerIds = hires
      .filter(h => h.offerId)
      .map(h => h.offerId);

    let offersMap = {};
    if (offerIds.length > 0) {
      const offers = await prisma.offer.findMany({
        where: { id: { in: offerIds } }
      });
      offers.forEach(o => { offersMap[o.id] = o; });
    }

    // Step 3: Fetch WorkerProfile and User for each hire's workerId
    const workerProfileIds = [...new Set(hires.map(h => h.workerId).filter(Boolean))];
    let workerProfilesMap = {};
    if (workerProfileIds.length > 0) {
      const profiles = await prisma.workerProfile.findMany({
        where: { id: { in: workerProfileIds } }
      });
      // Also fetch the User records for each profile
      const userIds = profiles.map(p => p.userId).filter(Boolean);
      let usersMap = {};
      if (userIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } }
        });
        users.forEach(u => { usersMap[u.id] = u; });
      }
      profiles.forEach(p => {
        workerProfilesMap[p.id] = {
          ...p,
          User: usersMap[p.userId] || null
        };
      });
    }

    const activePremiumIds = await getActivePremiumUserIds([
      ...hires.map((hire) => hire.employerId),
      ...Object.values(workerProfilesMap).map((profile) => profile.User?.id),
    ]);

    // Step 4: Merge all data into enriched hire objects
    const enrichedHires = hires.map(hire => {
      const offer = offersMap[hire.offerId] || null;
      const workerProfile = workerProfilesMap[hire.workerId] || null;
      const workerUser = workerProfile?.User || null;

      return {
        ...hire,
        workerName: offer?.workerName || workerUser?.fullName || null,
        workerEmail: offer?.workerEmail || workerUser?.email || null,
        workerPhone: offer?.workerPhone || workerUser?.phone || null,
        workerLocation: offer?.workerLocation || workerUser?.city || null,
        workerRating: workerProfile?.ratingAvg ?? offer?.workerRating ?? null,
        workerImage: offer?.workerImage || workerUser?.image || workerProfile?.profilePhotoUrl || null,
        workerSkills: offer?.workerSkills || workerProfile?.skills || [],
        jobTitle: offer?.jobTitle || null,
        salary: offer?.salary || hire.agreedSalary || null,
        hireId: hire.id,
        offerId: hire.offerId,
        workerId: workerProfile?.userId || workerUser?.id || hire.workerId,
        workerIsPremium: activePremiumIds.has(String(workerUser?.id || workerProfile?.userId || '')),
        employerIsPremium: activePremiumIds.has(String(hire.employerId)),
        isPremium: activePremiumIds.has(String(workerUser?.id || workerProfile?.userId || '')),
        workerProfileId: hire.workerId,
        // Work details from Hire (copied from Offer at acceptance)
        hourlyRate: hire.hourlyRate || offer?.hourlyRate || null,
        workingHoursPerDay: hire.workingHoursPerDay || offer?.workingHoursPerDay || null,
        workingDaysPerWeek: hire.workingDaysPerWeek || offer?.workingDaysPerWeek || null,
        weeklyDaysOff: hire.weeklyDaysOff || offer?.weeklyDaysOff || null,
        workStartTime: hire.workStartTime || offer?.workStartTime || null,
        workEndTime: hire.workEndTime || offer?.workEndTime || null,
        employmentStartDate: hire.employmentStartDate || offer?.employmentStartDate || null,
        additionalNotes: hire.additionalNotes || offer?.additionalNotes || null,
        startDate: hire.startDate,
        status: hire.status,
        paymentStatus: hire.paymentStatus,
        paymentMethod: hire.paymentMethod,
        paymentReference: hire.paymentReference,
        createdAt: hire.createdAt,
        updatedAt: hire.updatedAt
      };
    });

    res.json(enrichedHires);
  } catch (error) {
    console.error('Get hires error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET MY OFFERS (new endpoint)
export const getMyOffers = async (req, res) => {
  try {
    let offers;

    if (req.userRole === 'EMPLOYER') {
      offers = await prisma.offer.findMany({
        where: { employerId: req.userId },
        include: { Worker: true },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      const profile = await prisma.workerProfile.findUnique({ where: { userId: req.userId } });
      if (!profile) return res.json([]);
      offers = await prisma.offer.findMany({
        where: { workerId: profile.id },
        include: { Worker: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    // Transform offers to use User._id as workerId while preserving WorkerProfile._id
    const transformedOffers = offers.map(offer => ({
      ...offer,
      workerId: offer.Worker?.userId || offer.workerId,
      workerProfileId: offer.workerId
    }));

    const employerIds = [...new Set(transformedOffers.map(o => o.employerId).filter(Boolean))];
    let employerProfilesMap = {};
    if (employerIds.length > 0) {
      const profiles = await prisma.employerProfile.findMany({
        where: { userId: { in: employerIds } },
        select: { userId: true, ratingAvg: true, ratingCount: true },
      });
      profiles.forEach(p => {
        employerProfilesMap[p.userId] = { ratingAvg: p.ratingAvg, ratingCount: p.ratingCount };
      });
    }

    const enrichedOffers = transformedOffers.map(offer => {
      const ep = employerProfilesMap[offer.employerId] || {};
      return {
        ...offer,
        employerRating: ep.ratingAvg ?? null,
        employerRatingCount: ep.ratingCount ?? 0,
      };
    });

    res.json(enrichedOffers);
  } catch (error) {
    console.error('Get offers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE HIRE STATUS
// PHASE 2 SECURITY FIX:
// - Requires authentication (route now uses authenticate).
// - Whitelists the only statuses callers legitimately use ('terminated').
// - Ownership is enforced from the token: EMPLOYER must own the hire;
//   ADMIN may act on any hire. No other role may mutate hire status.
export const updateHireStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const hireId = String(req.params.hireId);

    if (!['terminated'].includes(status)) {
      return res.status(400).json({ message: 'Invalid hire status action' });
    }

    const hire = await prisma.hire.findUnique({ where: { id: hireId } });
    if (!hire) {
      return res.status(404).json({ message: 'Hire not found' });
    }

    if (req.userRole !== 'ADMIN') {
      if (req.userRole !== 'EMPLOYER') {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (String(hire.employerId) !== String(req.userId)) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (hire.status === 'terminated') {
      return res.status(400).json({ message: 'Hire is already terminated' });
    }

    const updatedHire = await prisma.hire.update({
      where: { id: hireId },
      data: { status },
    });
    res.json({ message: 'Hire status updated successfully', hire: updatedHire });

    if (String(req.userId) !== String(hire.workerId)) {
      sendPushToUser(hire.workerId, {
        title: 'Hire update',
        body: 'There is an update to your HomelyServ hire',
        data: {
          type: 'HIRE_STATUS_UPDATE',
          entityType: 'HIRE',
          hireId: String(hire.id),
        },
        channelId: 'hire',
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Update hire status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET ALL HIRES (admin only) - enriched with Offer, Worker, Employer data
export const getAllHires = async (req, res) => {
  try {
    const hires = await prisma.hire.findMany({
      orderBy: { createdAt: 'desc' }
    });

    if (!hires || hires.length === 0) {
      return res.json([]);
    }

    // Fetch related Offers
    const offerIds = hires.filter(h => h.offerId).map(h => h.offerId);
    let offersMap = {};
    if (offerIds.length > 0) {
      const offers = await prisma.offer.findMany({
        where: { id: { in: offerIds } }
      });
      offers.forEach(o => { offersMap[o.id] = o; });
    }

    // Fetch WorkerProfiles and Users
    const workerProfileIds = [...new Set(hires.map(h => h.workerId).filter(Boolean))];
    let workerProfilesMap = {};
    let employerUsersMap = {};

    if (workerProfileIds.length > 0) {
      const profiles = await prisma.workerProfile.findMany({
        where: { id: { in: workerProfileIds } }
      });
      const workerUserIds = profiles.map(p => p.userId).filter(Boolean);
      let workerUsersMap = {};
      if (workerUserIds.length > 0) {
        const users = await prisma.user.findMany({
          where: { id: { in: workerUserIds } },
          select: { id: true, fullName: true, email: true, phone: true, city: true, profileImage: true }
        });
        users.forEach(u => { workerUsersMap[u.id] = u; });
      }
      profiles.forEach(p => {
        workerProfilesMap[p.id] = {
          ...p,
          User: workerUsersMap[p.userId] || null
        };
      });
    }

    // Fetch Employer Users
    const employerIds = [...new Set(hires.map(h => h.employerId).filter(Boolean))];
    if (employerIds.length > 0) {
      const employers = await prisma.user.findMany({
        where: { id: { in: employerIds } },
        select: { id: true, fullName: true, email: true, phone: true, profileImage: true }
      });
      employers.forEach(u => { employerUsersMap[u.id] = u; });
    }

    const activePremiumIds = await getActivePremiumUserIds([
      ...employerIds,
      ...Object.values(workerProfilesMap).map((profile) => profile.User?.id),
    ]);

    // Enrich hires with all data
    const enrichedHires = hires.map(hire => {
      const offer = offersMap[hire.offerId] || null;
      const workerProfile = workerProfilesMap[hire.workerId] || null;
      const workerUser = workerProfile?.User || null;
      const employerUser = employerUsersMap[hire.employerId] || null;

      return {
        ...hire,
        workerName: offer?.workerName || workerUser?.fullName || null,
        workerEmail: offer?.workerEmail || workerUser?.email || null,
        workerPhone: offer?.workerPhone || workerUser?.phone || null,
        workerLocation: offer?.workerLocation || workerUser?.city || null,
        workerImage: workerUser?.profileImage || null,
        employerName: offer?.employerName || employerUser?.fullName || null,
        employerEmail: offer?.employerEmail || employerUser?.email || null,
        employerPhone: employerUser?.phone || null,
        employerImage: employerUser?.profileImage || null,
        jobTitle: offer?.jobTitle || null,
        salary: offer?.salary || hire.agreedSalary || null,
        hireId: hire.id,
        offerId: hire.offerId,
        workerId: workerProfile?.userId || workerUser?.id || hire.workerId,
        workerProfileId: hire.workerId,
        workerIsPremium: activePremiumIds.has(String(workerUser?.id || workerProfile?.userId || '')),
        employerIsPremium: activePremiumIds.has(String(hire.employerId)),
        // Work details from Hire (copied from Offer at acceptance)
        hourlyRate: hire.hourlyRate || offer?.hourlyRate || null,
        workingHoursPerDay: hire.workingHoursPerDay || offer?.workingHoursPerDay || null,
        workingDaysPerWeek: hire.workingDaysPerWeek || offer?.workingDaysPerWeek || null,
        weeklyDaysOff: hire.weeklyDaysOff || offer?.weeklyDaysOff || null,
        workStartTime: hire.workStartTime || offer?.workStartTime || null,
        workEndTime: hire.workEndTime || offer?.workEndTime || null,
        employmentStartDate: hire.employmentStartDate || offer?.employmentStartDate || null,
        additionalNotes: hire.additionalNotes || offer?.additionalNotes || null,
        // Commission and payment info
        commissionAmount: hire.commissionAmount,
        vatAmount: hire.vatAmount,
        totalDue: hire.totalDue,
        paymentReference: hire.paymentReference,
        status: hire.status,
        paymentStatus: hire.paymentStatus,
        createdAt: hire.createdAt,
        updatedAt: hire.updatedAt
      };
    });

    res.json(enrichedHires);
  } catch (error) {
    console.error('Get all hires error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// UPDATE OFFER STATUS
// Compatibility endpoint for the active WorkerOffers "complete work" action.
// Worker acceptance/rejection is exclusively handled by respondToOffer.
export const updateOfferStatus = async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body;

    if (status !== 'completed') {
      return res.status(400).json({ message: 'Only work completion is supported by this endpoint' });
    }

    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found' });
    }

    if (req.userRole !== 'WORKER') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const profile = await findOwnedWorkerProfile(req.userId);
    if (!profile || String(offer.workerId) !== String(profile.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!['accepted', 'paid', 'in_progress'].includes(offer.status)) {
      if (offer.status === 'completed') {
        return res.json({ message: 'Offer already completed', offer });
      }
      return res.status(409).json({ message: 'Offer cannot be completed from its current status' });
    }

    const updatedOffer = await prisma.offer.update({
      where: { id: offerId },
      data: { status }
    });

    await createNotification(
      profile.userId,
      'offer',
      'Offer Status Updated',
      `Your offer for ${offer.jobTitle} has been updated to ${status}`
    );

    res.json({ message: 'Offer status updated', offer: updatedOffer });

    if (String(req.userId) !== String(offer.employerId)) {
      sendPushToUser(offer.employerId, {
        title: 'Offer update',
        body: 'There is an update to your job offer',
        data: {
          type: 'OFFER_STATUS_UPDATE',
          entityType: 'OFFER',
          offerId: String(offer.id),
        },
        channelId: 'jobs_offers',
      }).catch(() => {});
    }
  } catch (error) {
    console.error('Update offer status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// CONFIRM PAYMENT
export const confirmPayment = async (req, res) => {
  try {
    const hire = await prisma.hire.update({
      where: { id: req.params.id },
      data: { paymentStatus: 'confirmed', status: 'active' }
    });

    // Worker Earnings Ledger — Phase 1. Idempotently ensure one PENDING
    // contractual record for the now-active hire.
    try {
      await ensureInitialWorkerEarning(hire);
    } catch (earningError) {
      console.error(`⚠️ Could not ensure worker earning for hire ${hire.id}:`, earningError.message);
    }

    res.json({ message: 'Payment confirmed', hire });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// SUBMIT PAYMENT PROOF
export const submitPayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const paymentProofUrl = req.file ? req.file.path : null;

    if (!paymentProofUrl) {
      return res.status(400).json({ message: 'Payment receipt is required' });
    }

    const hire = await prisma.hire.update({
      where: { id: req.params.id },
      data: {
        paymentMethod,
        paymentProofUrl,
        paymentStatus: 'pending'
      }
    });
    res.json({ message: 'Payment submitted', hire });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
