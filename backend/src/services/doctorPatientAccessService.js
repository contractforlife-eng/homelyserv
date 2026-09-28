// backend/src/services/doctorPatientAccessService.js
import DoctorAppointment from '../models/DoctorAppointment.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';

// Established relationship appointment statuses
export const VALID_PATIENT_RELATIONSHIP_STATUSES = Object.freeze(['CONFIRMED', 'COMPLETED']);

/**
 * Checks whether an established Doctor -> Patient relationship exists.
 *
 * Two additive relationship sources (both require real HomelyServ business):
 *   1. A DoctorAppointment in a valid status (CONFIRMED or COMPLETED) —
 *      the original rule, unchanged.
 *   2. An explicit, active DoctorPatientLink created by the doctor from the
 *      HomelyServ Medical Center. Links can only be created when a real
 *      appointment already exists between the two users (enforced in the
 *      link controller), so this never broadens access beyond users the
 *      doctor already has appointment business with.
 *
 * Medical-data access STILL requires the same downstream checks as before:
 * patient consent, Premium rules, and MedicalAccessLog audit entries.
 *
 * @param {string|import('mongoose').Types.ObjectId} doctorId
 * @param {string|import('mongoose').Types.ObjectId} patientId
 * @returns {Promise<boolean>}
 */
export const hasValidDoctorPatientRelationship = async (doctorId, patientId) => {
  if (!doctorId || !patientId) return false;

  const appointmentCount = await DoctorAppointment.countDocuments({
    doctorId,
    patientId,
    status: { $in: VALID_PATIENT_RELATIONSHIP_STATUSES }
  });
  if (appointmentCount > 0) return true;

  const activeLink = await DoctorPatientLink.findOne({
    doctorId,
    patientId,
    isActive: true
  }).select('_id');

  return Boolean(activeLink);
};
