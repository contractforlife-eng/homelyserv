// backend/src/controllers/doctorDashboardController.js
// ============================================================
// DOCTOR DASHBOARD SUMMARY
// Real backend data only — no invented statistics. Counts are
// computed from the doctor's own appointments, patients,
// consultations, prescriptions, services, and unread chat.
//
// OPTIONAL DATE RANGE (used by Doctor CMS -> Reports):
//   ?from=<ISO date>&to=<ISO date>
//   When present, ACTIVITY counts are limited to that range:
//     - appointments         filtered by `startsAt`  (the same field the
//                            existing analytics daily-activity query uses)
//     - consultation records filtered by `createdAt`
//   Resource/relationship counts (patients, clinic patients, services,
//   clinics, prescriptions, unread messages, latest appointment) stay
//   all-time so existing business definitions never change.
//   `doctorId` is NEVER read from the query/body — always req.userId.
//
// DASHBOARD "TODAY" BLOCK (summary.today):
//   The Doctor Dashboard shows the doctor's WORK FOR TODAY, not lifetime
//   totals. `summary.today` is an ADDITIVE block: every pre-existing field
//   above keeps its exact meaning (all-time patients, all-time relationship
//   breakdown, and the Reports ?from/?to activity range). Nothing existing
//   was repurposed, so Reports and the CMS Overview are unaffected.
//
//   The requested day boundaries ARE the today window: the Dashboard sends
//   browser-local start-of-day/end-of-day as ?from/?to (the same calendar-day
//   convention DoctorCmsReports already uses). Server-local time is NEVER
//   used. When no range is requested, a UTC calendar day is the
//   deterministic fallback so `today` is always present and well-defined.
//
//   Today unique patients count patients with MEANINGFUL ACTIVITY TODAY:
//     1. a DoctorAppointment scheduled today whose status is CONFIRMED or
//        COMPLETED — from EITHER patient source the model supports
//        (patientId XOR clinicPatientId), read as two explicit `distinct`
//        calls because a patientId-only query silently drops every clinic
//        patient; and
//     2. a ClinicPatient REGISTERED by this doctor today (`createdAt` within
//        the same bounds) — registering a walk-in is real patient work, and
//        a brand-new clinic patient has no appointment yet, so rule 1 alone
//        could never see them.
//   Both sources are unioned into ONE identity set, so the same real person is
//   counted exactly once no matter how many records or appointments name them.
//   `ClinicPatient.linkedUserId` is the identity bridge between the sources
//   ONLY — it is NEVER used for ownership, which stays scoped to `doctorId`
//   (= req.userId) on every query.
// ============================================================
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import Prescription from '../models/Prescription.js';
import DoctorConsultationService, { DOCTOR_CONSULTATION_TYPES } from '../models/DoctorConsultationService.js';
import DoctorClinic from '../models/DoctorClinic.js';
import ClinicPatient from '../models/ClinicPatient.js';
import Message from '../models/Message.js';
import { VALID_PATIENT_RELATIONSHIP_STATUSES } from '../services/doctorPatientAccessService.js';

const idStr = (v) => String(v || '');

// Deterministic UTC calendar-day boundaries for the `today` block. Used ONLY
// as a fallback when the caller sends no ?from/?to (e.g. the CMS Overview).
// The Doctor Dashboard always sends browser-local bounds, so this never
// decides the Dashboard's own day. Mirrors analyticsController.js `utcDayStart`.
const utcDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Parse one optional date bound from the query string.
 * Returns { date: Date|null } on success or { error } on invalid input.
 */
const parseDateBound = (raw, field) => {
  if (raw === undefined || raw === null || raw === '') return { date: null };
  if (typeof raw !== 'string') return { error: `"${field}" must be a date string` };
  const ms = Date.parse(raw);
  if (Number.isNaN(ms)) return { error: `"${field}" must be a valid ISO date` };
  return { date: new Date(ms) };
};

export const getDoctorDashboardSummary = async (req, res) => {
  try {
    const doctorId = req.userId;

    // ---- Optional activity date range (Reports screen) ----
    const fromParsed = parseDateBound(req.query?.from, 'from');
    if (fromParsed.error) {
      return res.status(400).json({ success: false, message: fromParsed.error });
    }
    const toParsed = parseDateBound(req.query?.to, 'to');
    if (toParsed.error) {
      return res.status(400).json({ success: false, message: toParsed.error });
    }
    const from = fromParsed.date;
    const to = toParsed.date;
    if (from && to && from.getTime() > to.getTime()) {
      return res.status(400).json({
        success: false,
        message: '"from" must not be after "to"'
      });
    }
    const hasRange = Boolean(from || to);
    const rangeBound = {
      ...(from ? { $gte: from } : {}),
      ...(to ? { $lte: to } : {})
    };

    // Activity filters — always scoped to the authenticated doctor ONLY.
    const appointmentFilter = {
      doctorId,
      ...(hasRange ? { startsAt: rangeBound } : {})
    };
    const consultationFilter = {
      doctorId,
      ...(hasRange ? { createdAt: rangeBound } : {})
    };

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      cancelledAppointments,
      completedAppointments,
      noShowAppointments,
      appointmentTypeCounts,
      totalConsultations,
      draftConsultations,
      signedConsultations,
      amendedConsultations,
      homelyServPatientIds,
      clinicPatientCount,
      clinicPatientLinkedIds,
      issuedPrescriptions,
      activeServices,
      clinics,
      lastAppointment,
      unreadMessages
    ] = await Promise.all([
      DoctorAppointment.countDocuments(appointmentFilter),
      DoctorAppointment.countDocuments({ ...appointmentFilter, status: 'PENDING' }),
      DoctorAppointment.countDocuments({ ...appointmentFilter, status: 'CONFIRMED' }),
      DoctorAppointment.countDocuments({ ...appointmentFilter, status: 'CANCELLED' }),
      DoctorAppointment.countDocuments({ ...appointmentFilter, status: 'COMPLETED' }),
      DoctorAppointment.countDocuments({ ...appointmentFilter, status: 'NO_SHOW' }),
      // Appointment counts by consultation type (same doctor-scoped filter).
      Promise.all(
        DOCTOR_CONSULTATION_TYPES.map((type) =>
          DoctorAppointment.countDocuments({ ...appointmentFilter, consultationType: type })
        )
      ),
      DoctorConsultationRecord.countDocuments(consultationFilter),
      DoctorConsultationRecord.countDocuments({ ...consultationFilter, status: 'DRAFT' }),
      DoctorConsultationRecord.countDocuments({ ...consultationFilter, status: 'SIGNED' }),
      DoctorConsultationRecord.countDocuments({ ...consultationFilter, status: 'AMENDED' }),
      // Existing patient definition (matches GET /api/doctors/patients):
      // distinct HomelyServ users with a CONFIRMED/COMPLETED appointment
      // relationship. `distinct` yields null for clinic-patient appointments
      // (patientId is null there) — filtered out so a null can never be
      // counted as a "patient".
      DoctorAppointment.distinct('patientId', {
        doctorId,
        status: { $in: VALID_PATIENT_RELATIONSHIP_STATUSES }
      }),
      // Clinic Patients — same rule as GET /api/doctors/clinic-patients:
      // every doctor-owned ClinicPatient record (no delete endpoint exists;
      // inactive records remain listed there too).
      ClinicPatient.countDocuments({ doctorId }),
      ClinicPatient.distinct('linkedUserId', { doctorId, linkedUserId: { $ne: null } }),
      Prescription.countDocuments({ doctorId, status: 'ISSUED' }),
      DoctorConsultationService.countDocuments({ doctorId, isActive: true }),
      DoctorClinic.countDocuments({ doctorId, isActive: true }),
      DoctorAppointment.findOne({ doctorId }).sort({ startsAt: -1 }).select('startsAt status'),
      Message.countDocuments({ recipientId: idStr(doctorId), isRead: false })
    ]);

    // Null-safe, deduplicated HomelyServ patient set (IDs only — identity is
    // never inferred from names).
    const homelyServPatientSet = new Set(
      homelyServPatientIds.filter(Boolean).map(idStr)
    );
    const homelyServPatients = homelyServPatientSet.size;

    // Combined unique patient entities across both sources. The ONLY identity
    // bridge the existing model supports is ClinicPatient.linkedUserId: a
    // clinic patient whose linkedUserId is one of this doctor's HomelyServ
    // patients is the same entity and is counted exactly once.
    const overlapCount = clinicPatientLinkedIds
      .filter(Boolean)
      .filter((id) => homelyServPatientSet.has(idStr(id)))
      .length;
    const combinedPatients = homelyServPatients + clinicPatientCount - overlapCount;

    const byConsultationType = {};
    DOCTOR_CONSULTATION_TYPES.forEach((type, idx) => {
      byConsultationType[type] = appointmentTypeCounts[idx];
    });

    // ---- Dashboard "TODAY" operational block (additive; see header) ----
    // The requested ?from/?to ARE the today window when supplied (the
    // Dashboard sends browser-local start/end of day). Otherwise fall back to
    // a deterministic UTC calendar day so `today` is never undefined.
    const todayStart = from || utcDayBounds().start;
    const todayEnd = to || utcDayBounds().end;
    const todayBound = { $gte: todayStart, $lte: todayEnd };
    const todayAppointmentFilter = { doctorId, startsAt: todayBound };
    // A patient relationship for today must be CONFIRMED or COMPLETED, so
    // PENDING / CANCELLED / NO_SHOW today-appointments never add a patient.
    const todayRelationshipStatuses = { $in: VALID_PATIENT_RELATIONSHIP_STATUSES };

    const [
      todayPending,
      todayConfirmed,
      todayHomelyServPatientIds,
      todayClinicPatientIds
    ] = await Promise.all([
      DoctorAppointment.countDocuments({ ...todayAppointmentFilter, status: 'PENDING' }),
      DoctorAppointment.countDocuments({ ...todayAppointmentFilter, status: 'CONFIRMED' }),
      // BOTH patient sources are read explicitly: `patientId` is null on a
      // clinic-patient appointment, so querying one field alone would silently
      // drop every clinic patient.
      DoctorAppointment.distinct('patientId', {
        ...todayAppointmentFilter,
        status: todayRelationshipStatuses
      }),
      DoctorAppointment.distinct('clinicPatientId', {
        ...todayAppointmentFilter,
        status: todayRelationshipStatuses
      })
    ]);

    // `distinct` yields null for the other source on every row; drop nulls so
    // an absent patient can never be counted as one.
    const todayClinicPatientSet = new Set(todayClinicPatientIds.filter(Boolean).map(idStr));
    // Canonical, globally de-duplicated set of real people for today.
    const todayPatientIdentities = new Set();

    // ---- Unique patients for today ----
    // One canonical identity per real person, so no source can double-count
    // another. `linkedUserId` collapses a clinic patient onto the HomelyServ
    // user it is linked to; a clinic patient with no link is its own person.
    const personKey = (clinicPatientId, linkedUserId) => (
      linkedUserId
        ? `user:${idStr(linkedUserId)}`
        : `clinic:${idStr(clinicPatientId)}`
    );

    // HomelyServ patients from today's qualifying appointments.
    todayHomelyServPatientIds
      .filter(Boolean)
      .forEach((id) => todayPatientIdentities.add(`user:${idStr(id)}`));

    // Resolve `linkedUserId` ONLY for the clinic patients seen in today's
    // qualifying appointments, scoped to THIS doctor by `doctorId`.
    if (todayClinicPatientSet.size > 0) {
      const todayClinicPatientsSeen = await ClinicPatient.find({
        doctorId,
        _id: { $in: [...todayClinicPatientSet] }
      }).select('_id linkedUserId');
      for (const doc of todayClinicPatientsSeen || []) {
        todayPatientIdentities.add(personKey(doc?._id, doc?.linkedUserId));
      }
    }

    // Source 2 — clinic patients REGISTERED by this doctor today. Creating one
    // is real patient work, and a brand-new walk-in has no appointment yet, so
    // without this the Dashboard could never reflect adding a patient.
    const todayCreatedClinicPatients = await ClinicPatient.find({
      doctorId,
      createdAt: todayBound
    }).select('_id linkedUserId');
    for (const doc of todayCreatedClinicPatients || []) {
      todayPatientIdentities.add(personKey(doc?._id, doc?.linkedUserId));
    }

    const todayUniquePatients = todayPatientIdentities.size;

    return res.json({
      success: true,
      summary: {
        appointments: {
          total: totalAppointments,
          pending: pendingAppointments,
          confirmed: confirmedAppointments,
          cancelled: cancelledAppointments,
          completed: completedAppointments,
          noShow: noShowAppointments,
          byConsultationType
        },
        patients: homelyServPatients,
        patientBreakdown: {
          homelyServ: homelyServPatients,
          clinicPatients: clinicPatientCount,
          combined: combinedPatients
        },
        consultations: {
          total: totalConsultations,
          signed: signedConsultations,
          drafts: draftConsultations,
          amended: amendedConsultations
        },
        prescriptionsIssued: issuedPrescriptions,
        activeServices,
        activeClinics: clinics,
        latestAppointment: lastAppointment
          ? { startsAt: lastAppointment.startsAt, status: lastAppointment.status }
          : null,
        unreadMessages,
        // Additive Dashboard "work for today" block. Independent of every
        // field above: those keep their all-time / ranged meaning.
        today: {
          range: { from: todayStart.toISOString(), to: todayEnd.toISOString() },
          appointments: {
            pending: todayPending,
            confirmed: todayConfirmed
          },
          uniquePatients: todayUniquePatients
        },
        // Echo of the applied activity range (null = all-time).
        dateRange: hasRange
          ? { from: from ? from.toISOString() : null, to: to ? to.toISOString() : null }
          : null
      }
    });
  } catch (error) {
    console.error('Error building doctor dashboard summary:', error);
    return res.status(500).json({ success: false, message: 'Server error building dashboard summary' });
  }
};
