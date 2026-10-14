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
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorConsultationService from '../models/DoctorConsultationService.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';
import TeacherProfile from '../models/TeacherProfile.js';
import TeacherStudent from '../models/TeacherStudent.js';
import TeacherGroup from '../models/TeacherGroup.js';
import TeacherGroupEnrollment from '../models/TeacherGroupEnrollment.js';
import { getSearchableDoctorProfile, listAvailableSlots, DOCTOR_CARD_FIELDS } from '../services/doctorSearchService.js';
import { toTeacherDiscoveryDto, resolveTeacherPremiumIds } from '../controllers/studentTeacherDiscoveryController.js';
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService.js';
import { normalizeEmail } from '../security/rootAdmin.js';
import { sendVerificationOnRegistration } from '../services/verificationService.js';
import { getJwtSecret } from '../config/jwtSecret.js';
// Phase 5B: shared per-doctor booking transaction (guard -> overlap -> insert).
import { withDoctorBookingTransaction } from '../services/doctorBookingGuard.js';

const router = express.Router();

const isObjectId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val);
const clean = (val, max) => String(val || '').replace(/[<>]/g, '').trim().slice(0, max);
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,25}$/;

/**
 * Safely extracts and verifies the authenticated user from the Bearer token if present.
 * Never throws; returns null if token is missing, invalid, expired, or user is not found.
 */
const resolveOptionalAuthenticatedUser = async (req) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    const userId = decoded.userId || decoded.id;
    if (!userId || !isObjectId(String(userId))) return null;

    const user = await User.findById(userId).select('_id email role isSuspended tokenVersion');
    if (!user || user.isSuspended) return null;

    const tokenVersion = decoded.tokenVersion ?? 0;
    const currentVersion = user.tokenVersion ?? 0;
    if (tokenVersion !== currentVersion) return null;

    return user;
  } catch {
    return null;
  }
};

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

    const clinicId = req.query.clinicId ? String(req.query.clinicId) : '';
    const isQueryClinicId = isObjectId(clinicId);

    const [slots, clinics] = await Promise.all([
      listAvailableSlots(doctorId, { now, booked, days: 14, clinicId: isQueryClinicId ? clinicId : undefined }),
      DoctorClinic.find({ doctorId, isActive: true })
        .select('clinicName phone email addressLine city countryCode isPrimary instructions')
        .sort({ isPrimary: -1, createdAt: 1 })
        .lean()
    ]);

    if (isQueryClinicId && !clinics.some((c) => String(c._id) === clinicId)) {
      return res.status(404).json({ success: false, message: 'Selected clinic is invalid or inactive' });
    }

    return res.json({
      success: true,
      count: slots.length,
      consultationFee: discoverable.profile.consultationFee || 0,
      currency: 'EGP',
      slots,
      clinics: clinics.map((c) => ({
        id: String(c._id),
        clinicName: c.clinicName,
        phone: c.phone || '',
        addressLine: c.addressLine,
        city: c.city,
        countryCode: c.countryCode,
        isPrimary: Boolean(c.isPrimary),
        instructions: c.instructions || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching doctor public availability:', error);
    return res.status(500).json({ success: false, message: 'Server error loading availability' });
  }
});

/**
 * POST /api/public/doctors/:doctorId/appointments
 * Guest booking without HomelyServ User account.
 * Submits a PENDING request; the doctor must approve before it becomes
 * confirmed. Atomic concurrency protected.
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

    // Clinic selection validation: if clinicId is supplied in body, verify it belongs
    // to this doctor, is active, and matches the schedule's clinicId.
    const requestedClinicId = body.clinicId ? String(body.clinicId) : '';
    if (requestedClinicId) {
      if (!isObjectId(requestedClinicId)) {
        return res.status(400).json({ success: false, message: 'Invalid clinic ID' });
      }
      const clinicRecord = await DoctorClinic.findOne({ _id: requestedClinicId, doctorId, isActive: true }).lean();
      if (!clinicRecord) {
        return res.status(404).json({ success: false, message: 'Selected clinic is invalid or inactive' });
      }
      if (String(schedule.clinicId || '') !== requestedClinicId) {
        return res.status(400).json({ success: false, message: 'Schedule does not match the selected clinic' });
      }
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

    // Optional authentication check: if caller is authenticated, derive patient identity safely
    const authenticatedUser = await resolveOptionalAuthenticatedUser(req);
    const visitorEmail = body.email ? normalizeEmail(clean(body.email, 100)) : '';

    // Guest booking critical section (Phase 5B): guard write -> overlap
    // re-read -> ClinicPatient find/create -> appointment insert, all inside
    // ONE transaction with the SAME session. The in-process slot lock is no
    // longer the correctness mechanism for this path (the lock file itself
    // is left untouched).
    const appointment = await withDoctorBookingTransaction(
      { doctorId, startsAt: startDate, endsAt: endDate },
      async (session) => {
        let clinicPatientId = null;
        let patientId = null;

        if (authenticatedUser) {
          // Authenticated patient linking: derives strictly from verified JWT
          patientId = authenticatedUser._id;
        } else {
          // Anonymous guest booking: Create or reuse the doctor-scoped ClinicPatient within the session.
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
                  email: visitorEmail || '',
                  notes: 'Registered via public profile guest booking',
                  linkedUserId: null,
                  isActive: true
                }
              ],
              { session }
            );
            clinicPatient = createdPatient;
          } else if (visitorEmail && !clinicPatient.email) {
            clinicPatient.email = visitorEmail;
            await clinicPatient.save({ session });
          }
          clinicPatientId = clinicPatient._id;
        }

        // Create DoctorAppointment: satisfies the exact-one-patient-source invariant
        // (patientId XOR clinicPatientId)
        const [created] = await DoctorAppointment.create(
          [
            {
              doctorId,
              patientId,
              clinicPatientId,
              scheduleId: schedule._id,
              clinicId: schedule.clinicId || null,
              serviceId: schedule.serviceId || null,
              consultationType: schedule.consultationType,
              startsAt: startDate,
              endsAt: endDate,
              status: 'PENDING', // Awaiting doctor approval
              reason: visitorReason,
              notes: `Guest booking by ${visitorName} (${visitorPhone})`,
              feeSnapshot,
              currency,
              createdBy: authenticatedUser ? authenticatedUser._id : doctorId
            }
          ],
          { session }
        );
        return created;
      }
    );

    // Doctor notification: dispatched only AFTER the transaction commits,
    // exactly once per pending booking (best-effort, unchanged semantics).
    createNotification(doctorId, {
      type: NOTIFICATION_TYPES.APPOINTMENT_REQUESTED,
      title: 'New Guest Booking Requested',
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

/**
 * GET /api/public/teachers/:teacherId/groups
 * List a published teacher's groups that currently have OPEN enrollment.
 * Anonymous-safe: exposes only scheduling/mode/location metadata, never
 * student records, counts, or private notes.
 */
router.get('/teachers/:teacherId/groups', publicRateLimit(60000, 60), async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!isObjectId(teacherId)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher ID' });
    }

    const user = await User.findById(teacherId).select('_id role isSuspended');
    if (!user || String(user.role).toUpperCase() !== 'TEACHER' || user.isSuspended) {
      return res.status(404).json({ success: false, message: 'Teacher not found or unavailable' });
    }

    const profile = await TeacherProfile.findOne({ userId: teacherId }).lean();
    if (!profile || !profile.isPublished) {
      return res.status(404).json({ success: false, message: 'Teacher profile is not published' });
    }

    // Only ACTIVE groups with OPEN enrollment are visible to the public.
    const groups = await TeacherGroup.find({
      teacherId,
      isActive: true,
      status: 'ACTIVE',
      enrollmentOpen: true
    })
      .sort({ createdAt: -1 })
      .lean();

    const groupDtos = groups.map((g) => ({
      id: String(g._id),
      name: g.name || '',
      subject: g.subject || '',
      gradeLevel: g.gradeLevel || '',
      academicYear: g.academicYear || '',
      description: g.description || '',
      scheduleDays: Array.isArray(g.scheduleDays) ? g.scheduleDays : [],
      onlineMode: g.onlineMode || 'IN_PERSON',
      locationAddress: g.locationAddress || '',
      locationCity: g.locationCity || '',
      locationCountry: g.locationCountry || '',
      color: g.color || '#DC2626'
    }));

    return res.json({ success: true, count: groupDtos.length, groups: groupDtos });
  } catch (error) {
    console.error('Error fetching public teacher groups:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching groups' });
  }
});

/**
 * POST /api/public/teachers/:teacherId/groups/:groupId/enroll
 * Submit an anonymous/public group-enrollment request.
 * Creates a PENDING TeacherGroupEnrollment (NOT an active membership) and a
 * PENDING TeacherStudent roster entry when the visitor is not yet on the
 * teacher's roster. Requires teacher approval to become active membership.
 */
router.post('/teachers/:teacherId/groups/:groupId/enroll', publicRateLimit(60000, 15), async (req, res) => {
  try {
    const { teacherId, groupId } = req.params;
    if (!isObjectId(teacherId) || !isObjectId(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid teacher or group ID' });
    }

    const user = await User.findById(teacherId).select('_id role isSuspended');
    if (!user || String(user.role).toUpperCase() !== 'TEACHER' || user.isSuspended) {
      return res.status(404).json({ success: false, message: 'Teacher not found or unavailable' });
    }

    const profile = await TeacherProfile.findOne({ userId: teacherId }).lean();
    if (!profile || !profile.isPublished) {
      return res.status(404).json({ success: false, message: 'Teacher profile is not published' });
    }

    // Group must be ACTIVE, belong to this teacher, and have OPEN enrollment.
    const group = await TeacherGroup.findOne({
      _id: groupId,
      teacherId,
      isActive: true,
      status: 'ACTIVE'
    }).lean();
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }
    if (!group.enrollmentOpen) {
      return res.status(409).json({ success: false, message: 'Enrollment is closed for this group' });
    }

    const body = req.body || {};
    const studentName = clean(body.name || body.studentName, 120);
    const phone = clean(body.phone, 30);
    const rawEmail = clean(body.email, 100);
    const gradeLevel = clean(body.gradeLevel, 100);
    const school = clean(body.school, 150);
    const message = clean(body.message || body.notes, 1000);

    if (!studentName) {
      return res.status(400).json({ success: false, message: 'Student/Visitor name is required' });
    }
    if (!phone || !PHONE_REGEX.test(phone)) {
      return res.status(400).json({ success: false, message: 'A valid contact phone number is required' });
    }

    const email = rawEmail ? normalizeEmail(rawEmail) : '';
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    // Optional authentication check: if caller has a valid Bearer token, resolve their User identity
    const authenticatedUser = await resolveOptionalAuthenticatedUser(req);

    let linkedStudentUserId = null;
    let isNewAccountCreated = false;
    let existingUser = null;

    if (email) {
      // 1. Look up existing User by normalized email
      existingUser = await User.findOne({ email });

      if (existingUser) {
        const userRole = String(existingUser.role || '').toUpperCase();

        if (userRole !== 'STUDENT') {
          // F-02 & F-01: Generic response to prevent account enumeration / role disclosure
          return res.status(409).json({
            success: false,
            message: 'Unable to process request with this email. Please sign in to your HomelyServ account or contact support.'
          });
        }

        // F-01: An existing STUDENT account is only linked if the caller is authenticated
        // as that exact student. If anonymous, we keep the request unlinked (guest roster entry)
        // to prevent account hijacking.
        if (authenticatedUser && String(authenticatedUser._id) === String(existingUser._id)) {
          linkedStudentUserId = existingUser._id;
        } else {
          // Anonymous visitor supplied an existing student email:
          // Do NOT link to the existing account. Treat as guest/unlinked.
          linkedStudentUserId = null;
        }
      } else {
        // 2. Create new STUDENT account securely (F-03)
        const randomPassword = crypto.randomBytes(24).toString('base64url');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(randomPassword, salt);

        const newStudent = new User({
          fullName: studentName,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          phone,
          countryCode: group.locationCountry ? String(group.locationCountry).slice(0, 2).toUpperCase() : '',
          countryName: group.locationCountry || '',
          mustChangePassword: true,
          emailVerified: false
        });

        await newStudent.save();
        linkedStudentUserId = newStudent._id;
        isNewAccountCreated = true;

        // Trigger email verification / setup flow (non-blocking, fire-and-forget, safe error logging)
        try {
          sendVerificationOnRegistration(newStudent);
        } catch (mailErr) {
          console.error('[EMAIL] Failed to trigger registration verification email:', mailErr);
        }
      }
    } else if (authenticatedUser && String(authenticatedUser.role).toUpperCase() === 'STUDENT') {
      linkedStudentUserId = authenticatedUser._id;
    }

    // 3. Find or create TeacherStudent roster entry (F-04)
    // Identity matching rules:
    // a. If linkedStudentUserId is verified: look up by linkedUserId / studentUserId first.
    // b. Otherwise, require BOTH phone AND studentName to match before reusing a roster entry,
    //    and NEVER reuse a record that belongs to another verified user.
    let teacherStudent = null;
    if (linkedStudentUserId) {
      teacherStudent = await TeacherStudent.findOne({
        teacherId,
        $or: [
          { linkedUserId: linkedStudentUserId },
          { studentUserId: linkedStudentUserId }
        ]
      });
    }

    if (!teacherStudent && phone) {
      // Find candidate matching exact teacherId, phone, and studentName
      const candidate = await TeacherStudent.findOne({
        teacherId,
        phone,
        fullName: studentName
      });
      // Do NOT reuse if candidate belongs to a different verified student user
      if (candidate) {
        const belongsToSameStudent = (linkedStudentUserId && String(candidate.linkedUserId) === String(linkedStudentUserId)) ||
          (existingUser && String(candidate.linkedUserId) === String(existingUser._id));
        if (!candidate.linkedUserId || belongsToSameStudent) {
          teacherStudent = candidate;
        }
      }
    }

    if (teacherStudent) {
      // If student is verified and record wasn't linked yet, link them safely
      if (linkedStudentUserId && (!teacherStudent.linkedUserId || !teacherStudent.studentUserId)) {
        teacherStudent.linkedUserId = linkedStudentUserId;
        teacherStudent.studentUserId = linkedStudentUserId;
        if (email && !teacherStudent.email) teacherStudent.email = email;
        await teacherStudent.save();
      }
    } else {
      teacherStudent = await TeacherStudent.create({
        teacherId,
        fullName: studentName,
        phone,
        email: email || '',
        gradeLevel: gradeLevel || '',
        school: school || '',
        subjects: group.subject ? [group.subject] : [],
        notes: message,
        relationshipStatus: 'PENDING',
        status: 'ACTIVE',
        linkedUserId: linkedStudentUserId || null,
        studentUserId: linkedStudentUserId || null,
        isActive: true
      });
    }

    // 4. Prevent duplicate pending or active enrollment in this group
    let enrollment;
    const existing = await TeacherGroupEnrollment.findOne({
      groupId: group._id,
      teacherId,
      studentId: teacherStudent._id
    });

    if (existing) {
      if (existing.isActive && (existing.status === 'PENDING' || existing.status === 'ACTIVE')) {
        return res.status(409).json({
          success: false,
          message: 'You already have a pending or active enrollment for this group'
        });
      }

      // Reactivate the historical enrollment as a fresh PENDING request.
      existing.isActive = true;
      existing.status = 'PENDING';
      existing.enrolledAt = new Date();
      if (message) existing.notes = message;
      await existing.save();
      enrollment = existing;
    } else {
      enrollment = await TeacherGroupEnrollment.create({
        teacherId,
        groupId: group._id,
        studentId: teacherStudent._id,
        enrolledAt: new Date(),
        status: 'PENDING',
        notes: message,
        isActive: true
      });
    }

    // Non-blocking notification to teacher (stubbed in tests).
    createNotification(teacherId, {
      type: NOTIFICATION_TYPES.SYSTEM,
      title: 'New Group Enrollment Request',
      message: `${studentName} requested to join ${group.name} via your public profile.`,
      entityType: 'TEACHER_GROUP_ENROLLMENT',
      entityId: String(enrollment._id),
      link: '/teacher-groups',
      data: { phone, groupId: String(group._id) }
    }).catch((err) => console.error('Group enrollment notification error:', err.message));

    // F-02: Never leak internal studentUserId or account credentials to anonymous callers
    return res.status(201).json({
      success: true,
      message: isNewAccountCreated
        ? 'Enrollment request submitted! A Student account was created for you; please check your email to verify and set your password.'
        : 'Enrollment request submitted and is pending teacher review',
      request: {
        id: String(enrollment._id),
        groupId: String(group._id),
        groupName: group.name,
        studentName,
        status: 'PENDING'
      }
    });
  } catch (error) {
    console.error('Error submitting public group enrollment:', error);
    return res.status(500).json({ success: false, message: 'Server error processing enrollment request' });
  }
});

export default router;
