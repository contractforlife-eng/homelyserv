// backend/src/controllers/clinicPatientMedicalRecordController.js
// ============================================================
// CLINIC PATIENT MEDICAL RECORD (Phase 2A)
//
// Doctor-maintained persistent medical background for a ClinicPatient.
//
// SCOPE BOUNDARY:
//   - Does NOT touch PatientMedicalProfile (patient-authored, consent
//     and Premium gated) or any HomelyServ patient architecture.
//   - Does NOT create appointments, consultations, diagnoses, vitals
//     or prescriptions. Those are later phases.
//   - `linkedUserId` is deliberately NOT consulted: only the owning
//     doctor may read or write this record.
//
// AUTHORISATION ORDER (every request):
//   1. requireDoctor middleware (role check)
//   2. resolve the ClinicPatient by id
//   3. verify clinicPatient.doctorId === req.userId
//   4. only then touch the medical record
// A ClinicPatient owned by another doctor yields 404, so existence
// of another doctor's patient is never disclosed.
// ============================================================
import ClinicPatient from '../models/ClinicPatient.js';
import ClinicPatientMedicalRecord, {
  CLINIC_RECORD_SMOKING_STATUSES
} from '../models/ClinicPatientMedicalRecord.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const MAX = {
  item: 200,
  familyHistory: 2000,
  disabilityStatus: 200,
  otherMedicalHistory: 5000,
  clinicalNotes: 5000,
  importantConditions: 2000
};

/** Clean, empty record used when a doctor has not written one yet. */
export const emptyMedicalRecordDto = (clinicPatientId, doctorId) => ({
  clinicPatientId: String(clinicPatientId),
  doctorId: String(doctorId),
  chronicConditions: [],
  allergies: [],
  currentMedications: [],
  previousSurgeries: [],
  familyHistory: '',
  smokingStatus: 'UNKNOWN',
  disabilityStatus: '',
  otherMedicalHistory: '',
  clinicalNotes: '',
  importantConditions: '',
  isNew: true,
  updatedAt: null
});

export const toMedicalRecordDto = (doc) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    clinicPatientId: String(d.clinicPatientId),
    doctorId: String(d.doctorId),
    chronicConditions: Array.isArray(d.chronicConditions) ? d.chronicConditions : [],
    allergies: Array.isArray(d.allergies) ? d.allergies : [],
    currentMedications: Array.isArray(d.currentMedications) ? d.currentMedications : [],
    previousSurgeries: Array.isArray(d.previousSurgeries) ? d.previousSurgeries : [],
    familyHistory: d.familyHistory || '',
    smokingStatus: d.smokingStatus || 'UNKNOWN',
    disabilityStatus: d.disabilityStatus || '',
    otherMedicalHistory: d.otherMedicalHistory || '',
    clinicalNotes: d.clinicalNotes || '',
    importantConditions: d.importantConditions || '',
    isNew: false,
    updatedAt: d.updatedAt || null
  };
};

/**
 * Resolves the ClinicPatient and enforces ownership.
 * Returns { ok, patient } or { ok: false, status, message }.
 */
const resolveOwnedClinicPatient = async (patientId, doctorId) => {
  if (!isValidObjectId(String(patientId || ''))) {
    return { ok: false, status: 404, message: 'Clinic patient not found' };
  }
  const patient = await ClinicPatient.findOne({ _id: patientId, doctorId });
  if (!patient) {
    // Covers both "does not exist" and "belongs to another doctor" so we
    // never leak the existence of another doctor's record.
    return { ok: false, status: 404, message: 'Clinic patient not found' };
  }
  return { ok: true, patient };
};

const parseStringList = (value, maxItem) => {
  if (value === null || value === undefined) return { ok: true, value: undefined };
  if (!Array.isArray(value)) return { ok: false, message: 'Must be a list of strings' };
  const list = value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim().slice(0, maxItem))
    .filter((v) => v.length > 0);
  if (list.length !== value.length) {
    return { ok: false, message: 'List entries must be non-empty strings' };
  }
  return { ok: true, value: list };
};

const parseText = (value, max) => {
  if (value === null || value === undefined) return { ok: true, value: undefined };
  if (typeof value !== 'string') return { ok: false, message: 'Must be a string' };
  return { ok: true, value: value.trim().slice(0, max) };
};

/**
 * GET /api/doctors/clinic-patients/:patientId/medical-record
 * Returns the doctor's persistent record. When none exists yet a clean
 * empty default is returned (200) rather than a confusing 404.
 */
export const getClinicPatientMedicalRecord = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    const owned = await resolveOwnedClinicPatient(patientId, doctorId);
    if (!owned.ok) {
      return res.status(owned.status).json({ success: false, message: owned.message });
    }

    const record = await ClinicPatientMedicalRecord.findOne({
      doctorId,
      clinicPatientId: patientId
    });

    if (!record) {
      return res.json({
        success: true,
        record: emptyMedicalRecordDto(patientId, doctorId)
      });
    }

    return res.json({
      success: true,
      record: toMedicalRecordDto(record)
    });
  } catch (error) {
    console.error('Error loading clinic patient medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error loading medical record'
    });
  }
};

/**
 * PUT /api/doctors/clinic-patients/:patientId/medical-record
 * Creates or updates the doctor's persistent record (upsert).
 * Only the fields present in the body are changed.
 */
export const upsertClinicPatientMedicalRecord = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;
    const body = req.body || {};

    const owned = await resolveOwnedClinicPatient(patientId, doctorId);
    if (!owned.ok) {
      return res.status(owned.status).json({ success: false, message: owned.message });
    }

    // Validate everything BEFORE writing anything.
    const updates = {};

    const listFields = [
      ['chronicConditions', MAX.item],
      ['allergies', MAX.item],
      ['currentMedications', MAX.item],
      ['previousSurgeries', MAX.item]
    ];
    for (const [field, maxItem] of listFields) {
      if (body[field] === undefined) continue;
      const parsed = parseStringList(body[field], maxItem);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, message: `${field}: ${parsed.message}` });
      }
      updates[field] = parsed.value;
    }

    const textFields = [
      ['familyHistory', MAX.familyHistory],
      ['disabilityStatus', MAX.disabilityStatus],
      ['otherMedicalHistory', MAX.otherMedicalHistory],
      ['clinicalNotes', MAX.clinicalNotes],
      ['importantConditions', MAX.importantConditions]
    ];
    for (const [field, max] of textFields) {
      if (body[field] === undefined) continue;
      const parsed = parseText(body[field], max);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, message: `${field}: ${parsed.message}` });
      }
      updates[field] = parsed.value;
    }

    if (body.smokingStatus !== undefined) {
      const upper = String(body.smokingStatus).toUpperCase();
      if (upper === '') {
        updates.smokingStatus = 'UNKNOWN';
      } else if (CLINIC_RECORD_SMOKING_STATUSES.includes(upper)) {
        updates.smokingStatus = upper;
      } else {
        return res.status(400).json({
          success: false,
          message: `smokingStatus must be one of ${CLINIC_RECORD_SMOKING_STATUSES.join(', ')}`
        });
      }
    }

    // doctorId / clinicPatientId are NEVER taken from the body.
    const record = await ClinicPatientMedicalRecord.findOneAndUpdate(
      { doctorId, clinicPatientId: patientId },
      { $set: updates, $setOnInsert: { doctorId, clinicPatientId: patientId } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Medical record saved',
      record: toMedicalRecordDto(record)
    });
  } catch (error) {
    // Unique-index violation means a concurrent request created it first.
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A medical record already exists for this patient'
      });
    }
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error saving clinic patient medical record:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error saving medical record'
    });
  }
};

