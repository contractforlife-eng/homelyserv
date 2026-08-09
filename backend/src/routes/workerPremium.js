// backend/src/routes/workerPremium.js
// Worker-only availability & "Actively Looking" endpoints.
//
// Ownership: always derived from the authenticated token (req.userId).
// The client can NEVER supply a userId — so an Employer/Support/other Worker
// cannot change another user's state here (requireWorker + ownership check).
//
// Source of truth:
//   availability   -> WorkerProfile.availability  (canonical; 'available'/'unavailable')
//   activelyLooking-> WorkerProfile.activelyLooking, but its EFFECTIVE value
//                    is gated on an ACTIVE Premium subscription, enforced here
//                    and in every read path (search / profile).
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireWorker } from '../middleware/auth.js';
import { getActiveSubscription } from '../services/premiumService.js';

const router = express.Router();

const ALLOWED_AVAILABILITY = ['available', 'unavailable'];

const readOwnProfile = async (userId) => {
  return prisma.workerProfile.findUnique({
    where: { userId: String(userId) },
    select: {
      availability: true,
      activelyLooking: true
    }
  });
};

const buildStatusPayload = async (userId) => {
  const profile = await readOwnProfile(userId);
  const subscription = await getActiveSubscription(userId);
  const isPremium = !!subscription;

  return {
    success: true,
    isPremium,
    availability: profile?.availability || 'available',
    available: (profile?.availability || 'available') === 'available',
    // Effective "Actively Looking" — only while the worker is AVAILABLE and
    // Premium is active (a stored true has no effect otherwise).
    activelyLooking:
      (profile?.availability || 'available') === 'available' &&
      isPremium &&
      profile?.activelyLooking === true,
    activelyLookingStored: profile?.activelyLooking === true,
    subscription: subscription
      ? {
          plan: subscription.plan,
          status: subscription.status,
          endDate: subscription.endDate
        }
      : null
  };
};

// ============================================================
// GET /api/worker/availability — current availability + premium state
// ============================================================
router.get('/availability', requireWorker, async (req, res) => {
  try {
    const payload = await buildStatusPayload(req.userId);
    return res.json(payload);
  } catch (error) {
    console.error('GET availability error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load availability' });
  }
});

// ============================================================
// PUT /api/worker/availability — worker toggles ONLY their own normal
// availability ('available'/'unavailable'). Available to EVERY worker, free
// or premium — truthful availability is never a paid-only field.
// ============================================================
router.put('/availability', requireWorker, async (req, res) => {
  try {
    const { available } = req.body || {};
    const value = available === true || available === false ? (available ? 'available' : 'unavailable') : null;

    if (!value || !ALLOWED_AVAILABILITY.includes(value)) {
      return res.status(400).json({
        success: false,
        error: 'available must be a boolean (true/false)'
      });
    }

    const existing = await readOwnProfile(req.userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Worker profile not found — please finish setting up your worker profile first'
      });
    }

    // ATOMIC CONSISTENCY RULE: marking a worker "Not Available" MUST also clear
    // "Actively Looking" in the same write. Every read path computes the
    // effective Actively Looking as available && premium && stored, so clearing
    // the stored flag guarantees it stays false while unavailable. Switching
    // back to Available does NOT automatically re-enable Actively Looking — the
    // worker must explicitly re-enable it (Premium only).
    const updateData =
      value === 'unavailable'
        ? { availability: value, activelyLooking: false }
        : { availability: value };

    await prisma.workerProfile.update({
      where: { userId: String(req.userId) },
      data: updateData
    });

    const payload = await buildStatusPayload(req.userId);
    return res.json({ ...payload, message: 'Availability updated' });
  } catch (error) {
    console.error('PUT availability:', error);
    return res.status(500).json({ success: false, error: 'Failed to update availability' });
  }
});

// ============================================================
// PUT /api/worker/actively-looking — PREMIUM-ONLY toggle.
// Backend enforces entitlement: without an ACTIVE subscription the toggle is
// rejected (403). When premium expires, stored value has NO effect — every
// consumer recomputes the effective value from subscription state.
// ============================================================
router.put('/actively-looking', requireWorker, async (req, res) => {
  try {
    const { activelyLooking } = req.body || {};

    if (activelyLooking !== true && activelyLooking !== false) {
      return res.status(400).json({
        success: false,
        error: 'activelyLooking must be a boolean (true/false)'
      });
    }

    const subscription = await getActiveSubscription(req.userId);
    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: 'Actively Looking is a Premium feature. Activate Premium to use it.'
      });
    }

    const existing = await readOwnProfile(req.userId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Worker profile not found yet — please finish your worker profile first'
      });
    }

    // CONSISTENCY RULE: a worker cannot be "Not Available" AND "Actively
    // Looking". Turning the toggle OFF is always allowed; turning it ON is
    // rejected while the worker is marked Not Available (the availability
    // endpoint already clears it, this guard covers the direct API path too).
    if (activelyLooking === true && (existing.availability || 'available') !== 'available') {
      return res.status(400).json({
        success: false,
        error: 'Set your availability to Available before enabling Actively Looking.'
      });
    }

    await prisma.workerProfile.update({
      where: { userId: String(req.userId) },
      data: { activelyLooking }
    });

    const payload = await buildStatusPayload(req.userId);
    return res.json({ ...payload, message: 'Actively Looking updated' });
  } catch (error) {
    console.error('PUT actively-looking:', error);
    return res.status(500).json({ success: false, error: 'Failed to update Actively Looking' });
  }
});

export default router;