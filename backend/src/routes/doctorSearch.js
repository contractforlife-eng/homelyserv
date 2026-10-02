// backend/src/routes/doctorSearch.js
// ============================================================
// FIND A DOCTOR (patient-facing discovery)
//
// Mounted at /api/doctor-search. Used by the "Find a Doctor" section of
// My Medical Profile.
//
// WHY A SEPARATE ROUTER: the existing Doctor card logic lives in
// GET /api/employer/search, which stays `requireEmployer` and is NOT
// relaxed. WORKER / TEACHER / STUDENT cannot call it, so this router
// exposes ONLY the doctor-listing function for the roles that can reach
// My Medical Profile.
//
// PRIVACY: this endpoint returns PUBLIC doctor card data only — the same
// allow-listed fields, behind the same isPublished / searchVisibility
// opt-in gate, built by the same shared service used by Employer Search.
// It exposes NO patient data, no private account data and no admin
// verification metadata. It is NOT the Doctor<->Patient medical-access
// path; that remains relationship + consent + Premium gated.
// ============================================================
import express from 'express';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { getActivePremiumUserIds, isUserPremium } from '../services/premiumService.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorProfile from '../models/DoctorProfile.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { findOverlappingAppointments } from '../controllers/doctorAppointmentController.js';
import {
  attachDoctorCards,
  escapeRegExp,
  getSearchableDoctorProfile,
  listAvailableSlots
} from '../services/doctorSearchService.js';

const router = express.Router();

// Same role set that can open My Medical Profile. DOCTOR is excluded: this is
// a patient-facing discovery feature.
const SEARCHABLE_ROLES = ['WORKER', 'EMPLOYER', 'TEACHER', 'STUDENT'];

const MAX_RESULTS = 50;

/**
 * Local middleware to require Premium entitlement for patient-facing doctor search and booking.
 */
const requirePremiumPatient = async (req, res, next) => {
  try {
    const premium = await isUserPremium(req.userId);
    if (!premium) {
      return res.status(403).json({
        success: false,
        code: 'PREMIUM_REQUIRED',
        message: 'Find a Doctor is a Premium-only feature.'
      });
    }
    return next();
  } catch (err) {
    console.error('Error verifying premium in doctorSearch:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify subscription status.'
    });
  }
};

/**
 * GET /api/doctor-search/doctors
 * Authenticated (any allowed role, Premium required). Optional ?q (name) ?specialty
 * ?country ?city. Returns public doctor cards only.
 */
router.get('/doctors', authenticate, requirePremiumPatient, async (req, res) => {
  try {
    const role = String(req.user?.role || '').toUpperCase();
    if (!SEARCHABLE_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Doctor search is not available for this account role.'
      });
    }

    const q = String(req.query?.q || '').trim();
    const specialty = String(req.query?.specialty || '').trim();
    const country = String(req.query?.country || '').trim();
    const city = String(req.query?.city || '').trim();

    // Only DOCTOR accounts are ever considered. Name search reuses the same
    // case-insensitive text semantics as the existing worker search.
    const filter = { role: 'DOCTOR' };
    if (q) {
      filter.fullName = { $regex: escapeRegExp(q), $options: 'i' };
    }
    if (country) {
      filter.countryCode = { $regex: escapeRegExp(country), $options: 'i' };
    }
    if (city) {
      filter.location = { $regex: escapeRegExp(city), $options: 'i' };
    }

    // Never select the password; contact fields are stripped below so only
    // the public card is returned.
    const candidates = await User.find(filter)
      .select('-password')
      .sort({ fullName: 1 })
      .limit(MAX_RESULTS);

    // Attach public doctor cards through the SHARED service. Doctors who
    // have not opted in are dropped by buildDoctorCard.
    // Premium entitlement, resolved in ONE batched query (no N+1) and NEVER
    // inferred on the client. Only a Boolean crosses the wire — no plan, price,
    // expiry or any other subscription detail is exposed. Hidden (non-opted-in)
    // doctors are filtered out before the response is sent, so their Premium
    // state is never returned. Same source of truth Employer Search uses.
    const premiumIds = await getActivePremiumUserIds(
      candidates.map((row) => String(row._id || row.id || '')).filter(Boolean)
    );

    // Attach public doctor cards through the SHARED service. Doctors who
    // have not opted in are dropped by buildDoctorCard.
    await attachDoctorCards(candidates, { premiumIds });

    // Specialty is a DoctorProfile field, so it is filtered AFTER the cards
    // are built rather than duplicating the visibility rule in the query.
    const needle = specialty ? specialty.toLowerCase() : '';
    const doctors = candidates
      .filter((row) => row.doctor)
      .map((row) => row.doctor)
      .filter((card) => {
        if (!needle) return true;
        return (
          String(card.specialty || '').toLowerCase().includes(needle) ||
          String(card.subspecialty || '').toLowerCase().includes(needle) ||
          (Array.isArray(card.additionalSpecialties) &&
            card.additionalSpecialties.some((s) => String(s || '').toLowerCase().includes(needle)))
        );
      });

    return res.json({ success: true, count: doctors.length, doctors });
  } catch (error) {
    console.error('Error searching doctors:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error searching doctors',
      error: error.message
    });
  }
});

// Reject any role that is not a medical-profile patient role. DOCTOR /
// ADMIN / SUPPORT are deliberately excluded: this is a patient-facing flow.
const requirePatientRole = (req, res, next) => {
  const role = String(req.user?.role || '').toUpperCase();
  if (!SEARCHABLE_ROLES.includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Booking is not available for this account role.'
    });
  }
  return next();
};

const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

// The single booking horizon, shared by the availability listing and the
// booking validation so the two can never disagree.
const AVAILABILITY_DAYS = 14;

/**
 * GET /api/doctor-search/doctors/:doctorId/availability
 *
 * Bookable slots for one discoverable doctor, derived from their ACTIVE
 * DoctorSchedule rows. Slots that already began, or that overlap a live
 * appointment, are never returned.
 */
router.get('/doctors/:doctorId/availability', authenticate, requirePatientRole, requirePremiumPatient, async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!isObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const discoverable = await getSearchableDoctorProfile(doctorId);
    if (!discoverable) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + (21 * 24 * 60 * 60 * 1000));
    const booked = await DoctorAppointment.find({
      doctorId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      startsAt: { $lt: horizon },
      endsAt: { $gt: now }
    }).select('startsAt endsAt');

    const slots = await listAvailableSlots(doctorId, { now, booked, days: AVAILABILITY_DAYS });

    return res.json({
      success: true,
      count: slots.length,
      consultationFee: discoverable.profile.consultationFee || 0,
      currency: 'EGP',
      slots
    });
  } catch (error) {
    console.error('Error loading doctor availability:', error);
    return res.status(500).json({ success: false, message: 'Server error loading availability' });
  }
});

/**
 * POST /api/doctor-search/doctors/:doctorId/appointments
 *
 * A HomelyServ user books themselves. The patient is ALWAYS the authenticated
 * user (req.userId) — any client-supplied patientId is ignored, and no
 * ClinicPatient is ever created. The request is PENDING until the doctor
 * confirms, at which point the existing Doctor Patients relationship rule
 * (CONFIRMED/COMPLETED) applies unchanged.
 */
router.post('/doctors/:doctorId/appointments', authenticate, requirePatientRole, requirePremiumPatient, async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!isObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const discoverable = await getSearchableDoctorProfile(doctorId);
    if (!discoverable) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const body = req.body || {};
    const scheduleId = body.scheduleId ? String(body.scheduleId) : '';
    if (!isObjectId(scheduleId)) {
      return res.status(400).json({ success: false, message: 'A valid scheduleId is required' });
    }

    // The slot MUST belong to this doctor and be an active schedule.
    const schedule = await DoctorSchedule.findOne({ _id: scheduleId, doctorId, isActive: true })
      .select('dayOfWeek startTime endTime slotDurationMinutes consultationType clinicId serviceId')
      .lean();
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'That appointment slot is not available' });
    }

    const now = new Date();
    // Re-generate the availability with the SAME window the listing endpoint
    // uses, so the only slots that can be booked are exactly the ones offered.
    const offered = await listAvailableSlots(doctorId, { now: new Date(), days: AVAILABILITY_DAYS });
    const slot = offered.find((s) => s.scheduleId === scheduleId && s.startsAt === String(body.startsAt));
    if (!slot) {
      return res.status(409).json({ success: false, message: 'That appointment slot is no longer available' });
    }

    // Shared overlap protection (same rule the doctor-side create uses).
    const overlapping = await findOverlappingAppointments(
      doctorId,
      new Date(slot.startsAt),
      new Date(slot.endsAt)
    );
    if (overlapping && overlapping.length > 0) {
      return res.status(409).json({ success: false, message: 'That appointment slot is no longer available' });
    }

    // Fee snapshot follows the existing rule: the schedule's service when set,
    // otherwise the doctor's own profile consultation fee.
    let feeSnapshot = Number(discoverable.profile.consultationFee) || 0;
    let currency = 'EGP';
    if (schedule.serviceId) {
      const service = await DoctorConsultationService.findOne({ _id: schedule.serviceId, doctorId })
        .select('price currency')
        .lean();
      if (service) {
        feeSnapshot = Number(service.price) || feeSnapshot;
        currency = service.currency || currency;
      }
    }
    if (schedule.clinicId) {
      const clinic = await DoctorClinic.findOne({ _id: schedule.clinicId, doctorId }).select('currency').lean();
      if (clinic?.currency) currency = clinic.currency;
    }

    const appointment = await DoctorAppointment.create({
      doctorId,
      // SERVER-DERIVED. A client-supplied patientId can never reach this.
      patientId: req.userId,
      clinicPatientId: null,
      scheduleId: schedule._id,
      clinicId: schedule.clinicId || null,
      serviceId: schedule.serviceId || null,
      consultationType: schedule.consultationType,
      startsAt: new Date(slot.startsAt),
      endsAt: new Date(slot.endsAt),
      // Patient requests always start as PENDING; the doctor confirms.
      status: 'PENDING',
      reason: typeof body.reason === 'string' ? body.reason.trim().substring(0, 500) : '',
      notes: '',
      feeSnapshot,
      currency,
      createdBy: req.userId
    });

    // Reuse the existing appointment-request notification.
    createNotification(doctorId, {
      type: NOTIFICATION_TYPES.APPOINTMENT_REQUESTED,
      title: 'New appointment request',
      message: `A new ${String(schedule.consultationType || 'clinic').toLowerCase()} appointment was requested for ${new Date(slot.startsAt).toLocaleString()}.`,
      entityType: 'DOCTOR_APPOINTMENT',
      entityId: String(appointment._id),
      link: '/doctor-appointments',
      data: { appointmentId: String(appointment._id), consultationType: schedule.consultationType }
    }).catch((error) => console.error('Appointment request notification failed:', error.message));

    return res.status(201).json({ success: true, appointment });
  } catch (error) {
    console.error('Error booking doctor appointment:', error);
    return res.status(500).json({ success: false, message: 'Server error booking appointment' });
  }
});

/**
 * GET /api/doctor-search/doctors/appointments/mine
 *
 * The signed-in patient's own appointments, so they can see that a request is
 * waiting for doctor confirmation. Strictly scoped to req.userId — a patient
 * can never read another patient's appointments.
 */
router.get('/doctors/appointments/mine', authenticate, requirePatientRole, requirePremiumPatient, async (req, res) => {
  try {
    const appointments = await DoctorAppointment.find({ patientId: req.userId })
      .populate('doctorId', 'fullName profileImage')
      .populate('clinicId', 'clinicName city addressLine')
      .sort({ startsAt: -1 })
      .limit(50);

    return res.json({
      success: true,
      count: appointments.length,
      appointments: appointments.map((a) => ({
        _id: String(a._id),
        doctor: a.doctorId
          ? { id: String(a.doctorId._id || a.doctorId), fullName: a.doctorId.fullName || '', profileImage: a.doctorId.profileImage || '' }
          : null,
        startsAt: a.startsAt,
        endsAt: a.endsAt,
        status: a.status,
        consultationType: a.consultationType,
        feeSnapshot: a.feeSnapshot,
        currency: a.currency,
        clinic: a.clinicId
          ? { clinicName: a.clinicId.clinicName || '', city: a.clinicId.city || '', addressLine: a.clinicId.addressLine || '' }
          : null
      }))
    });
  } catch (error) {
    console.error('Error loading my doctor appointments:', error);
    return res.status(500).json({ success: false, message: 'Server error loading appointments' });
  }
});

export default router;