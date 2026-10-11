// backend/src/routes/publicProfiles.js
// ============================================================
// PUBLIC PROFILES ROUTE
// Safe, anonymous access to published Doctor and Teacher profiles,
// and guest appointment / lesson requests.
//
// STRICT PRIVACY RULES:
// - Never exposes private phone/email unless explicitly part of public clinic card.
// - Never exposes patient/student records, medical info, passwords, tokens,
//   internal verification docs, payouts, or private notes.
// - Doctor booking: Creates ClinicPatient and DoctorAppointment with status CONFIRMED,
//   patientId: null, clinicPatientId: <id>, createdBy: doctorId.
// - Teacher request: Creates TeacherStudent (relationshipStatus: PENDING) with linkedUserId: null.
// ============================================================
import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import { getSearchableDoctorProfile, listAvailableSlots, DOCTOR_CARD_FIELDS } from '../services/doctorSearchService.js';
import { toTeacherDiscoveryDto, resolveTeacherPremiumIds } from '../controllers/studentTeacherDiscoveryController.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
// Phase 5B: shared per-doctor booking transaction (guard -> overlap -> insert).
import { withDoctorBookingTransaction } from '../services/doctorBookingGuard.js';

const router = express.Router();

const isObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
const clean = (val, max) => String(val || '').replace(/[<>]/g, '').trim().slice(0, max);
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,25}$/;

// Rate limiting map for public operations: key -> { count, resetAt }
const rateBuckets = new Map();
function publicRateLimit(windowMs, maximum) {
  return (req, res, next) => {
    const key = `${req.ip || 'anon'}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    } else if (++current.count > maximum) {
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again shortly.' });
    }
    if (rateBuckets.size > 5000) {
      for (const [k, v] of rateBuckets) {
        if (v.resetAt <= now) rateBuckets.delete(k);
      }
    }
    next();
  };
}

// ============================================================
// DOCTOR PUBLIC PROFILE & SLOTS
// ============================================================

/**
 * GET /api/public/doctors/:doctorId
 * Fetch public profile details of a published doctor.
 */
router.get('/doctors/:doctorId', publicRateLimit(60000, 60), async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!isObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const discoverable = await getSearchableDoctorProfile(doctorId);
    if (!discoverable) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not published' });
    }

    const { user, profile } = discoverable;

    // Fetch active clinics for this doctor (public info only)
    const clinics = await DoctorClinic.find({ doctorId, isActive: true })
      .select('clinicName phone email addressLine city countryCode isPrimary instructions')
      .sort({ isPrimary: -1, createdAt: 1 })
      .lean();

    // Fetch active consultation services (public title & fee info)
    const services = await DoctorConsultationService.find({ doctorId })
      .select('serviceName consultationType price currency durationMinutes description')
      .lean();

    const publicProfile = {
      id: String(user._id),
      fullName: user.fullName || '',
      profileImage: user.profileImage || profile.profileImage || '',
      professionalTitle: profile.professionalTitle || '',
      specialty: profile.specialty || '',
      additionalSpecialties: Array.isArray(profile.additionalSpecialties) ? profile.additionalSpecialties : [],
      subspecialty: profile.subspecialty || '',
      bio: profile.bio || '',
      experienceSummary: profile.experienceSummary || '',
      yearsOfExperience: profile.yearsOfExperience ?? 0,
      languages: Array.isArray(profile.languages) ? profile.languages : [],
      consultationFee: Number(profile.consultationFee) || 0,
      examinationFee: Number(profile.examinationFee) || 0,
      currency: 'EGP',
      clinics: clinics.map((c) => ({
        id: String(c._id),
        clinicName: c.clinicName,
        phone: c.phone || '',
        addressLine: c.addressLine,
        city: c.city,
        countryCode: c.countryCode,
        isPrimary: Boolean(c.isPrimary),
        instructions: c.instructions || ''
      })),
      services: services.map((s) => ({
        id: String(s._id),
        serviceName: s.serviceName,
        consultationType: s.consultationType,
        price: Number(s.price) || 0,
        currency: s.currency || 'EGP',
        durationMinutes: s.durationMinutes || 30,
        description: s.description || ''
      }))
    };

    return res.json({ success: true, doctor: publicProfile });
  } catch (error) {
    console.error('Error fetching public doctor profile:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching doctor profile' });
  }
});

/**
 * GET /api/public/doctors/:doctorId/availability
 * Fetch available booking slots for a published doctor over the next 14 days.
 */
router.get('/doctors/:doctorId/availability', publicRateLimit(60000, 60), async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!isObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const discoverable = await getSearchableDoctorProfile(doctorId);
    if (!discoverable) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not published' });
    }

    const now = new Date();
    const horizon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const booked = await DoctorAppointment.find({
      doctorId,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      startsAt: { $lt: horizon },
      endsAt: { $gt: now }
    }).select('startsAt endsAt');

    const slots = await listAvailableSlots(doctorId, { now, booked, days: 14 });

    return res.json({
      success: true,
      count: slots.length,
      consultationFee: discoverable.profile.consultationFee || 0,
      currency: 'EGP',
      slots
    });
  } catch (error) {
    console.error('Error fetching doctor public availability:', error);
    return res.status(500).json({ success: false, message: 'Server error loading availability' });
  }
});

/**
 * POST /api/public/doctors/:doctorId/appointments
 * Guest booking without HomelyServ User account.
 * Automatically confirmed. Atomic concurrency protected.
 */
router.post('/doctors/:doctorId/appointments', publicRateLimit(60000, 15), async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!isObjectId(doctorId)) {
      return res.status(400).json({ success: false, message: 'Invalid doctor ID' });
    }

    const discoverable = await getSearchableDoctorProfile(doctorId);
    if (!discoverable) {
      return res.status(404).json({ success: false, message: 'Doctor not found or not available' });
    }

    const body = req.body || {};
    const visitorName = clean(body.name || body.fullName, 120);
    const visitorPhone = clean(body.phone, 30);
    const visitorReason = clean(body.reason, 500);

    if (!visitorName) {
      return res.status(400).json({ success: false, message: 'Patient name is required' });
    }
    if (!visitorPhone || !PHONE_REGEX.test(visitorPhone)) {
      return res.status(400).json({ success: false, message: 'A valid contact phone number is required' });
    }

    const scheduleId = String(body.scheduleId || '');
    if (!isObjectId(scheduleId)) {
      return res.status(400).json({ success: false, message: 'A valid scheduleId is required' });
    }

    const requestedStartsAt = body.startsAt ? String(body.startsAt) : '';
    if (!requestedStartsAt || Number.isNaN(new Date(requestedStartsAt).getTime())) {
      return res.status(400).json({ success: false, message: 'A valid appointment startsAt timestamp is required' });
    }

    // Pre-transaction validation (Phase 5B): schedule ownership/active and
    // offered-slot checks are unchanged, but now run BEFORE the transaction
    // so the critical section stays short.
    const schedule = await DoctorSchedule.findOne({ _id: scheduleId, doctorId, isActive: true })
      .select('dayOfWeek startTime endTime slotDurationMinutes consultationType clinicId serviceId')
      .lean();
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'That appointment slot schedule is no longer available' });
    }

    const offered = await listAvailableSlots(doctorId, { now: new Date(), days: 14 });
    const slot = offered.find((s) => s.scheduleId === scheduleId && s.startsAt === requestedStartsAt);
    if (!slot) {
      return res.status(409).json({ success: false, message: 'That appointment slot is no longer available' });
    }

    const startDate = new Date(slot.startsAt);
    const endDate = new Date(slot.endsAt);

    // Resolve fee and currency (read-only, pre-transaction).
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

    // Guest booking critical section (Phase 5B): guard write -> overlap
    // re-read -> ClinicPatient find/create -> appointment insert, all inside
    // ONE transaction with the SAME session. The in-process slot lock is no
    // longer the correctness mechanism for this path (the lock file itself
    // is left untouched). No HomelyServ User account is ever created.
    const appointment = await withDoctorBookingTransaction(
      { doctorId, startsAt: startDate, endsAt: endDate },
      async (session) => {
        // Create or reuse the doctor-scoped ClinicPatient within the session.
        let clinicPatient = await ClinicPatient.findOne({
          doctorId,
          fullName: visitorName,
          phone: visitorPhone
        }).session(session);

        if (!clinicPatient) {
          const [createdPatient] = await ClinicPatient.create(
            [
              {
                doctorId,
                clinicId: schedule.clinicId || null,
                fullName: visitorName,
                phone: visitorPhone,
                notes: 'Registered via public profile guest booking',
                linkedUserId: null,
                isActive: true
              }
            ],
            { session }
          );
          clinicPatient = createdPatient;
        }

        // Create DoctorAppointment: patientId is null, clinicPatientId is set,
        // status is CONFIRMED — the exact-one-patient-source invariant holds.
        const [created] = await DoctorAppointment.create(
          [
            {
              doctorId,
              patientId: null,
              clinicPatientId: clinicPatient._id,
              scheduleId: schedule._id,
              clinicId: schedule.clinicId || null,
              serviceId: schedule.serviceId || null,
              consultationType: schedule.consultationType,
              startsAt: startDate,
              endsAt: endDate,
              status: 'CONFIRMED', // Requirement: automatically confirmed
              reason: visitorReason,
              notes: `Guest booking by ${visitorName} (${visitorPhone})`,
              feeSnapshot,
              currency,
              createdBy: doctorId
            }
          ],
          { session }
        );
        return created;
      }
    );

    // Doctor notification: dispatched only AFTER the transaction commits,
    // exactly once per confirmed booking (best-effort, unchanged semantics).
    createNotification(doctorId, {
      type: NOTIFICATION_TYPES.APPOINTMENT_REQUESTED,
      title: 'New Confirmed Guest Booking',
      message: `${visitorName} booked a ${String(schedule.consultationType || 'clinic').toLowerCase()} appointment for ${startDate.toLocaleString()}.`,
      entityType: 'DOCTOR_APPOINTMENT',
      entityId: String(appointment._id),
      link: '/doctor-cms/appointments',
      data: { appointmentId: String(appointment._id), guestPhone: visitorPhone }
    }).catch((err) => console.error('Guest booking notification error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Appointment booked and confirmed successfully',
      appointment: {
        id: String(appointment._id),
        doctorId: String(appointment.doctorId),
        patientName: visitorName,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        consultationType: appointment.consultationType,
        status: appointment.status,
        feeSnapshot: appointment.feeSnapshot,
        currency: appointment.currency
      }
    });
  } catch (error) {
    // Booking-transaction outcomes (Phase 5B). Commit ambiguity first: the
    // outcome is unknown, so never claim success or failure.
    if (error?.commitOutcome === 'UNKNOWN') {
      return res.status(503).json({
        success: false,
        message:
          'The booking outcome could not be confirmed. Please check your appointment list before retrying.'
      });
    }
    if (error?.statusCode === 409) {
      return res.status(409).json({ success: false, message: 'That appointment slot has just been booked' });
    }
    if (error?.statusCode === 503) {
      return res.status(503).json({
        success: false,
        message: 'Booking is temporarily unavailable. Please try again shortly.'
      });
    }
    console.error('Error creating guest doctor appointment:', error);
    return res.status(500).json({ success: false, message: 'Server error processing booking' });
  }
});

// ============================================================
// TEACHER PUBLIC PROFILE & GUEST LESSON INQUIRY
// ============================================================

/**
 * GET /api/public/teachers/:teacherId
 * Fetch safe public profile details of a published teacher.
 */
router.get('/teachers/:teacherId', publicRateLimit(60000, 60), async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!isObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }

    const user = await User.findById(teacherId).select('-password');
    if (!user || String(user.role).toUpperCase() !== 'TEACHER' || user.isSuspended) {
      return res.status(404).json({ success: false, message: 'Teacher not found or unavailable' });
    }

    const profile = await TeacherProfile.findOne({ userId: teacherId }).lean();
    if (!profile || !profile.isPublished) {
      return res.status(404).json({ success: false, message: 'Teacher profile is not published' });
    }

    const premiumSet = await resolveTeacherPremiumIds([teacherId]);
    const isPremium = premiumSet.has(String(teacherId));

    const teacherDto = toTeacherDiscoveryDto(user, profile, null, isPremium);

    return res.json({ success: true, teacher: teacherDto });
  } catch (error) {
    console.error('Error fetching public teacher profile:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching teacher profile' });
  }
});

/**
 * POST /api/public/teachers/:teacherId/inquiries
 * Submit an anonymous guest lesson inquiry/request for teacher review.
 */
router.post('/teachers/:teacherId/inquiries', publicRateLimit(60000, 15), async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!isObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }

    const teacherUser = await User.findById(teacherId).select('_id role isSuspended');
    if (!teacherUser || String(teacherUser.role).toUpperCase() !== 'TEACHER' || teacherUser.isSuspended) {
      return res.status(404).json({ success: false, message: 'Teacher not found or unavailable' });
    }

    const profile = await TeacherProfile.findOne({ userId: teacherId }).lean();
    if (!profile || !profile.isPublished || profile.availableForNewStudents === false) {
      return res.status(400).json({ success: false, message: 'Teacher is currently not accepting new students' });
    }

    const body = req.body || {};
    const studentName = clean(body.name || body.studentName, 120);
    const phone = clean(body.phone, 30);
    const email = clean(body.email, 100);
    const subject = clean(body.subject, 100) || profile.mainSubject || 'General';
    const gradeLevel = clean(body.gradeLevel, 100);
    const message = clean(body.message || body.notes, 1000);
    const requestedDate = clean(body.requestedDate, 50);
    const requestedTime = clean(body.requestedTime, 50);

    if (!studentName) {
      return res.status(400).json({ success: false, message: 'Student/Visitor name is required' });
    }
    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ success: false, message: 'A valid contact phone number is required' });
    }

    // Build or reuse external student roster entry
    let teacherStudent = await TeacherStudent.findOne({
      teacherId,
      fullName: studentName,
      phone
    });

    const inquiryDetails = [
      `[Guest Inquiry] Requested Subject: ${subject}`,
      requestedDate ? `Date: ${requestedDate}` : null,
      requestedTime ? `Time: ${requestedTime}` : null,
      message ? `Note: ${message}` : null
    ].filter(Boolean).join(' | ');

    if (!teacherStudent) {
      teacherStudent = await TeacherStudent.create({
        teacherId,
        fullName: studentName,
        phone,
        email: email || '',
        gradeLevel: gradeLevel || '',
        subjects: subject ? [subject] : [],
        notes: inquiryDetails,
        relationshipStatus: 'PENDING',
        status: 'ACTIVE',
        linkedUserId: null,
        studentUserId: null,
        isActive: true
      });
    } else {
      // Append inquiry to notes
      teacherStudent.notes = teacherStudent.notes
        ? `${teacherStudent.notes}\n${inquiryDetails}`
        : inquiryDetails;
      await teacherStudent.save();
    }

    // Non-blocking notification to Teacher
    createNotification(teacherId, {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'New Student Lesson Inquiry',
      message: `${studentName} sent a lesson inquiry for ${subject} via your public profile.`,
      entityType: 'TEACHER_STUDENT',
      entityId: String(teacherStudent._id),
      link: '/teacher-students',
      data: { phone, subject }
    }).catch((err) => console.error('Teacher inquiry notification error:', err.message));

    return res.status(201).json({
      success: true,
      message: 'Lesson inquiry submitted successfully and is pending teacher review',
      inquiry: {
        id: String(teacherStudent._id),
        teacherId: String(teacherId),
        studentName,
        subject,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Error submitting public teacher inquiry:', error);
    return res.status(500).json({ success: false, message: 'Server error processing inquiry' });
  }
});

export default router;
