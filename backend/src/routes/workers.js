// backend/src/routes/workers.js
import express from 'express';
import User from '../models/User.js';
import { enrichUserResponse } from '../utils/userResponse.js';
import prisma from '../lib/prisma.js';
import { authenticate, requireWorker } from '../middleware/auth.js';
import { isSupportedCurrency, normalizeCurrencyCode } from '../utils/currencyMetadata.js';
import { canContactWorker } from '../services/paymentAuthService.js';
import { isUserPremium } from '../services/premiumService.js';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwtSecret.js';
import { buildWorkerProfileUpdate, profileUpdateErrorResponse } from '../services/userProfileUpdateService.js';

const router = express.Router();

const STRICT_HOURLY_RATE_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

const normalizeHourlyRate = (value) => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;

  if (typeof value === 'number' && (!Number.isFinite(value) || !Number.isSafeInteger(Math.trunc(value)))) {
    return null;
  }

  const input = typeof value === 'string' ? value : String(value);
  if (!STRICT_HOURLY_RATE_PATTERN.test(input) || !/[1-9]/.test(input)) return null;

  if (!input.includes('.')) return input;
  return input.replace(/0+$/, '').replace(/\.$/, '');
};

// ============================================================
// Update authenticated Worker's advertised hourly rate
// ============================================================
router.patch('/hourly-rate', requireWorker, async (req, res) => {
  try {
    const body = req.body || {};
    const hasRate = Object.prototype.hasOwnProperty.call(body, 'hourlyRate');
    const hasCurrency = Object.prototype.hasOwnProperty.call(body, 'hourlyRateCurrency');

    if (!hasRate || !hasCurrency) {
      return res.status(400).json({
        success: false,
        message: 'hourlyRate and hourlyRateCurrency are required together'
      });
    }

    const { hourlyRate, hourlyRateCurrency } = body;
    const isClear = hourlyRate === null && hourlyRateCurrency === null;

    if ((hourlyRate === null) !== (hourlyRateCurrency === null)) {
      return res.status(400).json({
        success: false,
        message: 'hourlyRate and hourlyRateCurrency must be cleared together'
      });
    }

    let normalizedRate = null;
    let normalizedCurrency = null;

    if (!isClear) {
      normalizedRate = normalizeHourlyRate(hourlyRate);
      if (!normalizedRate) {
        return res.status(400).json({
          success: false,
          message: 'hourlyRate must be a positive decimal with at most 2 fractional digits'
        });
      }

      normalizedCurrency = normalizeCurrencyCode(hourlyRateCurrency);
      if (!normalizedCurrency || !isSupportedCurrency(normalizedCurrency)) {
        return res.status(400).json({
          success: false,
          message: 'Unsupported hourly rate currency'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { hourlyRate: normalizedRate, hourlyRateCurrency: normalizedCurrency } },
      { new: true, runValidators: true }
    ).select('hourlyRate hourlyRateCurrency');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      hourlyRate: user.hourlyRate,
      hourlyRateCurrency: user.hourlyRateCurrency
    });
  } catch (error) {
    console.error('Update hourly rate error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update hourly rate'
    });
  }
});

// ============================================================
// Get Worker Profile
// ============================================================
router.get('/profile/:userId', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.id = userObj._id;

    // Premium entitlement + availability (computed server-side, batched for
    // the single user; NEVER accepted from the request body).
    const [workerProfile, userIsPremium] = await Promise.all([
      prisma.workerProfile.findUnique({
        where: { userId: String(userObj.id) },
        select: { availability: true, activelyLooking: true }
      }),
      isUserPremium(String(userObj.id))
    ]);

    userObj.isPremium = userIsPremium;
    userObj.availability = workerProfile?.availability || 'available';
    userObj.available = (workerProfile?.availability || 'available') === 'available';
    // Effective "Actively Looking": only while the worker is AVAILABLE, an
    // active Premium subscription exists, AND the stored flag is true. A true
    // stored value has NO effect while Not Available or once the subscription
    // is inactive.
    userObj.activelyLooking =
      userObj.available && userIsPremium && workerProfile?.activelyLooking === true;
    
    let contactUnlocked = false;
    const requesterId = req.userId;
    const requesterRole = req.userRole;
    
    if (requesterRole === 'EMPLOYER') {
      // Convert User._id to WorkerProfile._id for payment check
      const workerProfile = await prisma.workerProfile.findUnique({
        where: { userId: String(userObj.id) }
      });
      const workerProfileId = workerProfile?.id || userObj.id;
      contactUnlocked = await canContactWorker(requesterId, workerProfileId);
    } else if (requesterRole === 'WORKER' || requesterRole === 'ADMIN') {
      contactUnlocked = true;
    } else if (String(requesterId) === String(userObj.id)) {
      contactUnlocked = true;
    }
    
    if (!contactUnlocked) {
      userObj.email = null;
      userObj.phone = null;
    }
    
    res.json({ success: true, user: userObj, contactUnlocked });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// ============================================================
// Update Worker Profile
// ============================================================
router.put('/profile/:userId', authenticate, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authenticatedUserId = req.userId;

    console.log('[WorkerProfile] req.params.userId:', targetUserId);
    console.log('[WorkerProfile] req.userId:', authenticatedUserId);
    console.log('[WorkerProfile] submitted fields:', Object.keys(req.body || {}));

    if (String(targetUserId) !== String(authenticatedUserId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Monetary fields are intentionally ignored here. Stale clients may still
    // send them, but PATCH /hourly-rate is the only active rate write path.
    const updates = buildWorkerProfileUpdate(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No updatable profile fields provided' });
    }

    const existingUser = await User.findById(authenticatedUserId).select('desiredJob tutorSpecialization');
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const finalDesiredJob = Object.prototype.hasOwnProperty.call(req.body, 'desiredJob')
      ? String(req.body.desiredJob || '')
      : String(existingUser.desiredJob || '');

    const tutorSpecializationProvided = Object.prototype.hasOwnProperty.call(req.body, 'tutorSpecialization');
    const finalTutorSpecialization = tutorSpecializationProvided
      ? String(req.body.tutorSpecialization || '')
      : String(existingUser.tutorSpecialization || '');

    if (finalDesiredJob === 'tutor') {
      const trimmedSpecialization = finalTutorSpecialization.trim();
      if (!trimmedSpecialization || trimmedSpecialization.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Specialization is required for tutors and must be 100 characters or fewer'
        });
      }
      if (tutorSpecializationProvided) {
        updates.tutorSpecialization = trimmedSpecialization;
      }
    } else if (tutorSpecializationProvided) {
      const trimmedSpecialization = String(req.body.tutorSpecialization || '').trim();
      if (trimmedSpecialization.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Specialization must be 100 characters or fewer'
        });
      }
      updates.tutorSpecialization = trimmedSpecialization;
    }
    
    const user = await User.findByIdAndUpdate(
      authenticatedUserId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userObj = user.toObject ? user.toObject() : { ...user };
    userObj.id = userObj._id;

    res.json({ success: true, user: enrichUserResponse(userObj) });
  } catch (error) {
    console.error('Update profile error:', { name: error.name, message: error.message });
    const response = profileUpdateErrorResponse(error);
    res.status(response.status).json(response.body);
  }
});

// ============================================================
// Get Worker Stats
// ============================================================
router.get('/stats/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    const profile = await prisma.workerProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const isOwner = String(req.userId) === String(userId);
    const isAdmin = req.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [
      totalOffers,
      acceptedOffers,
      totalHires,
      totalPayments,
      avgRating
    ] = await Promise.all([
      prisma.offer.count({ where: { workerId: profile.id } }),
      prisma.offer.count({ where: { workerId: profile.id, status: 'accepted' } }),
      prisma.hire.count({ where: { workerId: profile.id } }),
      prisma.payment.aggregate({
        where: { workerId: profile.id, status: 'completed' },
        _sum: { amount: true }
      }),
      prisma.review.aggregate({
        where: { workerId: profile.id },
        _avg: { rating: true }
      })
    ]);

    const totalEarnings = totalPayments._sum.amount || 0;
    const avgRatingValue = avgRating._avg.rating || 0;

    res.json({
      success: true,
      stats: {
        tasksCompleted: totalHires,
        totalTasks: totalHires,
        completionRate: totalHires > 0 ? Math.round((totalHires / totalOffers) * 100) : 0,
        tasksReceived: totalOffers,
        tasksRefused: totalOffers - acceptedOffers,
        refusalRate: totalOffers > 0 ? Math.round(((totalOffers - acceptedOffers) / totalOffers) * 100) : 0,
        totalEarnings,
        avgRating: Math.round(avgRatingValue * 10) / 10,
        activeOffers: totalOffers - acceptedOffers,
        totalOffers
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats'
    });
  }
});

// ============================================================
// Get Worker Payments
// ============================================================
router.get('/payments/:userId', authenticate, async (req, res) => {
  try {
    const userId = req.params.userId;

    const isOwner = String(req.userId) === String(userId);
    const isAdmin = req.userRole === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const profile = await prisma.workerProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return res.json({
        success: true,
        payments: []
      });
    }

    const payments = await prisma.payment.findMany({
      where: { workerId: profile.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments'
    });
  }
});

export default router;
