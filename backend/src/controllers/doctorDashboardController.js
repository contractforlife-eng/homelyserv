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
