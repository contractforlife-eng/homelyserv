// backend/src/controllers/doctorConsultationController.js
import mongoose from 'mongoose';
import DoctorConsultationRecord, { CONSULTATION_RECORD_STATUSES } from '../models/DoctorConsultationRecord.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import ClinicPatient from '../models/ClinicPatient.js';
import { VALID_PATIENT_RELATIONSHIP_STATUSES } from '../services/doctorPatientAccessService.js';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Verifies the appointment backing a ClinicPatient consultation.
 *
 * Required for every lifecycle operation: the linked appointment must
 * still exist, belong to THIS doctor, and belong to the SAME
 * ClinicPatient. HomelyServ records are unchanged (their appointment was
 * validated at creation and the relationship is appointment-derived).
 *
 * @returns {Promise<{ok:true}|{ok:false, status:number, message:string}>}
 */
const assertClinicAppointmentLink = async (record, doctorId, clinicPatientId) => {
  if (!clinicPatientId) return { ok: true };
  if (!record.appointmentId) {
    return { ok: false, status: 404, message: 'Linked appointment not found' };
  }
  const appointment = await DoctorAppointment.findOne({
    _id: record.appointmentId,
    doctorId,
    clinicPatientId
  });
  if (!appointment) {
    return {
      ok: false,
      status: 404,
      message: 'Linked appointment not found or not associated with this doctor and clinic patient'
    };
  }
  return { ok: true };
};

/**
 * Resolves the patient scope for a consultation request.
 *
 * A consultation belongs to EXACTLY ONE patient source:
 *   - `patientId` (req.params)       -> HomelyServ User, existing behaviour
 *   - `clinicPatientId` (req.query)  -> doctor-owned ClinicPatient (additive)
 *
 * Ownership is always validated server-side. For a ClinicPatient the owner
 * is matched on `doctorId` ONLY — `linkedUserId` is deliberately ignored so
 * it can never grant access.
 *
 * @returns {Promise<{ok:true, patientId:string|null, clinicPatientId:string|null}
 *                 | {ok:false, status:number, message:string}>}
 */
const resolveConsultationScope = async (req) => {
  const doctorId = req.userId;
  const { patientId } = req.params;
  const { clinicPatientId } = req.query || {};

  const hasUser = Boolean(patientId);
  const hasClinic = Boolean(clinicPatientId);

  if (hasUser && hasClinic) {
    return { ok: false, status: 400, message: 'Provide either patientId or clinicPatientId, not both' };
  }
  if (!hasUser && !hasClinic) {
    return { ok: false, status: 404, message: 'Patient not found' };
  }

  if (hasUser) {
    if (!isValidObjectId(patientId)) {
      return { ok: false, status: 404, message: 'Patient not found' };
    }
    return { ok: true, patientId, clinicPatientId: null };
  }

  if (!isValidObjectId(String(clinicPatientId))) {
    return { ok: false, status: 404, message: 'Clinic patient not found' };
  }
  const clinicPatient = await ClinicPatient.findOne({ _id: clinicPatientId, doctorId })
    .select('_id')
    .lean();
  if (!clinicPatient) {
    return { ok: false, status: 404, message: 'Clinic patient not found' };
  }
  return { ok: true, patientId: null, clinicPatientId: String(clinicPatient._id) };
};

/**
 * Validates and sanitizes vitals input.
 * Returns { valid: boolean, error?: string, sanitized?: object }
 */
const validateAndSanitizeVitals = (raw) => {
  if (raw === undefined || raw === null) {
    return { valid: true, sanitized: {} };
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return { valid: false, error: 'Vitals must be an object' };
  }

  // Explicit allow-list of fields
  const allowedKeys = [
    'bloodPressure',
    'heartRate',
    'respiratoryRate',
    'temperature',
    'oxygenSaturation',
    'weightKg',
    'heightCm'
  ];
  const keys = Object.keys(raw);
  for (const k of keys) {
    if (!allowedKeys.includes(k)) {
      return { valid: false, error: `Invalid vitals field: ${k}` };
    }
  }

  const sanitized = {};

  if (raw.bloodPressure !== undefined && raw.bloodPressure !== null && raw.bloodPressure !== '') {
    if (typeof raw.bloodPressure !== 'string') {
      return { valid: false, error: 'bloodPressure must be a string' };
    }
    const bp = raw.bloodPressure.trim();
    if (bp.length > 20) {
      return { valid: false, error: 'bloodPressure is too long (max 20 chars)' };
    }
    // Controlled BP format (e.g., 120/80)
    if (!/^\d{2,3}\/\d{2,3}$/.test(bp)) {
      return { valid: false, error: 'bloodPressure format must be systolic/diastolic (e.g., 120/80)' };
    }
    sanitized.bloodPressure = bp;
  } else {
    sanitized.bloodPressure = '';
  }

  const numericFields = [
    { key: 'heartRate', min: 20, max: 300, name: 'Heart rate' },
    { key: 'respiratoryRate', min: 4, max: 100, name: 'Respiratory rate' },
    { key: 'temperature', min: 25, max: 45, name: 'Temperature' },
    { key: 'oxygenSaturation', min: 0, max: 100, name: 'Oxygen saturation' },
    { key: 'weightKg', min: 1, max: 500, name: 'Weight' },
    { key: 'heightCm', min: 30, max: 300, name: 'Height' }
  ];

  for (const { key, min, max, name } of numericFields) {
    const val = raw[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (isNaN(num) || num < min || num > max) {
        return { valid: false, error: `${name} must be between ${min} and ${max}` };
      }
      sanitized[key] = num;
    } else {
      sanitized[key] = null;
    }
  }

  return { valid: true, sanitized };
};

/**
 * Validates and sanitizes diagnosis entries.
 * Returns { valid: boolean, error?: string, sanitized?: Array }
 */
const validateAndSanitizeDiagnosis = (raw) => {
  if (raw === undefined || raw === null) {
    return { valid: true, sanitized: [] };
  }
  if (!Array.isArray(raw)) {
    return { valid: false, error: 'Diagnosis must be an array' };
  }
  if (raw.length > 30) {
    return { valid: false, error: 'Maximum 30 diagnoses allowed' };
  }

  const sanitized = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, error: `Diagnosis item at index ${i} must be an object` };
    }

    const itemKeys = Object.keys(item);
    for (const k of itemKeys) {
      if (k !== 'name' && k !== 'icdCode') {
        return { valid: false, error: `Invalid field '${k}' in diagnosis item` };
      }
    }

    if (typeof item.name !== 'string' || !item.name.trim()) {
      return { valid: false, error: `Diagnosis item at index ${i} requires a non-empty name` };
    }
    const name = item.name.trim();
    if (name.length > 300) {
      return { valid: false, error: 'Diagnosis name exceeds 300 characters' };
    }

    let icdCode = '';
    if (item.icdCode !== undefined && item.icdCode !== null && item.icdCode !== '') {
      if (typeof item.icdCode !== 'string') {
        return { valid: false, error: 'icdCode must be a string' };
      }
      icdCode = item.icdCode.trim();
      if (icdCode.length > 30) {
        return { valid: false, error: 'icdCode exceeds 30 characters' };
      }
    }

    sanitized.push({ name, icdCode });
  }

  return { valid: true, sanitized };
};

/**
 * Validates clinical bounded text fields.
 */
const validateTextField = (val, max, fieldName) => {
  if (val === undefined || val === null) return { valid: true, value: '' };
  if (typeof val !== 'string') return { valid: false, error: `${fieldName} must be a string` };
  if (val.length > max) return { valid: false, error: `${fieldName} exceeds maximum length of ${max} characters` };
  return { valid: true, value: val.trim() };
};

/**
 * GET /api/doctors/patients/:patientId/consultations
 * List all consultation records between the authenticated Doctor and the patient.
 */
export const getDoctorPatientConsultations = async (req, res) => {
  try {
    const doctorId = req.userId;
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    // Verify Doctor/Patient relationship
    const relationshipExists = await DoctorAppointment.exists({
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId }),
      status: { $in: VALID_PATIENT_RELATIONSHIP_STATUSES }
    });

    if (!relationshipExists) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const records = await DoctorConsultationRecord.find({
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    })
      .populate('appointmentId', 'appointmentDate startTime endTime consultationType status')
      .populate('clinicId', 'clinicName city addressLine')
      .populate('serviceId', 'serviceName consultationType')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: records.length,
      consultations: records
    });
  } catch (error) {
    console.error('Error fetching doctor consultations:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching consultations' });
  }
};

/**
 * GET /api/doctors/patients/:patientId/consultations/:id
 * Get one consultation record for the current Doctor.
 */
export const getDoctorPatientConsultationById = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const record = await DoctorConsultationRecord.findOne({
      _id: id,
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    })
      .populate('appointmentId', 'appointmentDate startTime endTime consultationType status')
      .populate('clinicId', 'clinicName city addressLine')
      .populate('serviceId', 'serviceName consultationType')
      .populate('amendedRecordId', 'status signedAt createdAt');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    return res.json({
      success: true,
      consultation: record
    });
  } catch (error) {
    console.error('Error fetching doctor consultation by id:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching consultation' });
  }
};

/**
 * POST /api/doctors/patients/:patientId/consultations
 * Create a new DRAFT consultation record tied to a CONFIRMED or COMPLETED appointment.
 */
export const createDoctorConsultation = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { appointmentId, chiefComplaint, history, examination, diagnosis, treatmentPlan, vitals } = req.body || {};
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    // An appointment is MANDATORY and is never invented server-side.
    if (!appointmentId || !isValidObjectId(String(appointmentId))) {
      return res.status(400).json({ success: false, message: 'Valid appointmentId is required' });
    }

    // Appointment is source of truth for doctor, patient, clinic, service, consultationType.
    // It must belong to THIS doctor AND to the scoped patient — the frontend
    // is never trusted. clinicPatientId is matched for ClinicPatient scopes.
    const appointment = await DoctorAppointment.findOne({
      _id: appointmentId,
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or not associated with this doctor and patient'
      });
    }

    // Appointment must be CONFIRMED or COMPLETED
    if (!VALID_PATIENT_RELATIONSHIP_STATUSES.includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot create consultation for appointment with status ${appointment.status}. Must be CONFIRMED or COMPLETED.`
      });
    }

    // Duplicate safeguard: only 1 active DRAFT per appointment per Doctor
    const existingDraft = await DoctorConsultationRecord.findOne({
      doctorId,
      appointmentId,
      status: 'DRAFT'
    });
    if (existingDraft) {
      return res.status(409).json({
        success: false,
        message: 'An active DRAFT consultation already exists for this appointment',
        existingDraftId: existingDraft._id
      });
    }

    // Validate clinical text fields
    const ccVal = validateTextField(chiefComplaint, 2000, 'chiefComplaint');
    if (!ccVal.valid) return res.status(400).json({ success: false, message: ccVal.error });

    const histVal = validateTextField(history, 10000, 'history');
    if (!histVal.valid) return res.status(400).json({ success: false, message: histVal.error });

    const examVal = validateTextField(examination, 10000, 'examination');
    if (!examVal.valid) return res.status(400).json({ success: false, message: examVal.error });

    const planVal = validateTextField(treatmentPlan, 10000, 'treatmentPlan');
    if (!planVal.valid) return res.status(400).json({ success: false, message: planVal.error });

    // Validate structured diagnosis
    const diagVal = validateAndSanitizeDiagnosis(diagnosis);
    if (!diagVal.valid) return res.status(400).json({ success: false, message: diagVal.error });

    // Validate vitals
    const vitVal = validateAndSanitizeVitals(vitals);
    if (!vitVal.valid) return res.status(400).json({ success: false, message: vitVal.error });

    // Create DRAFT record snapshotted from appointment
    const newRecord = new DoctorConsultationRecord({
      doctorId,
      patientId: patientId || null,
      clinicPatientId: clinicPatientId || null,
      appointmentId: appointment._id,
      clinicId: appointment.clinicId || null,
      serviceId: appointment.serviceId || null,
      consultationType: appointment.consultationType,
      chiefComplaint: ccVal.value,
      history: histVal.value,
      examination: examVal.value,
      diagnosis: diagVal.sanitized,
      treatmentPlan: planVal.value,
      vitals: vitVal.sanitized,
      status: 'DRAFT',
      signedAt: null,
      createdByRole: 'DOCTOR',
      amendedRecordId: null
    });

    await newRecord.save();

    return res.status(201).json({
      success: true,
      message: 'Consultation draft created successfully',
      consultation: newRecord
    });
  } catch (error) {
    console.error('Error creating doctor consultation:', error);
    return res.status(500).json({ success: false, message: 'Server error creating consultation' });
  }
};

/**
 * PUT /api/doctors/patients/:patientId/consultations/:id
 * Update only DRAFT consultation records. SIGNED or AMENDED records are immutable.
 */
export const updateDoctorConsultation = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const record = await DoctorConsultationRecord.findOne({
      _id: id,
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const linkCheck = await assertClinicAppointmentLink(record, doctorId, clinicPatientId);
    if (!linkCheck.ok) {
      return res.status(linkCheck.status).json({ success: false, message: linkCheck.message });
    }

    // IMMUTABILITY RULE: Only DRAFT records can be updated
    if (record.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Cannot edit consultation with status '${record.status}'. Signed clinical records are immutable.`
      });
    }

    const { chiefComplaint, history, examination, diagnosis, treatmentPlan, vitals } = req.body || {};

    // Validate fields if provided
    if (chiefComplaint !== undefined) {
      const ccVal = validateTextField(chiefComplaint, 2000, 'chiefComplaint');
      if (!ccVal.valid) return res.status(400).json({ success: false, message: ccVal.error });
      record.chiefComplaint = ccVal.value;
    }

    if (history !== undefined) {
      const histVal = validateTextField(history, 10000, 'history');
      if (!histVal.valid) return res.status(400).json({ success: false, message: histVal.error });
      record.history = histVal.value;
    }

    if (examination !== undefined) {
      const examVal = validateTextField(examination, 10000, 'examination');
      if (!examVal.valid) return res.status(400).json({ success: false, message: examVal.error });
      record.examination = examVal.value;
    }

    if (treatmentPlan !== undefined) {
      const planVal = validateTextField(treatmentPlan, 10000, 'treatmentPlan');
      if (!planVal.valid) return res.status(400).json({ success: false, message: planVal.error });
      record.treatmentPlan = planVal.value;
    }

    if (diagnosis !== undefined) {
      const diagVal = validateAndSanitizeDiagnosis(diagnosis);
      if (!diagVal.valid) return res.status(400).json({ success: false, message: diagVal.error });
      record.diagnosis = diagVal.sanitized;
    }

    if (vitals !== undefined) {
      const vitVal = validateAndSanitizeVitals(vitals);
      if (!vitVal.valid) return res.status(400).json({ success: false, message: vitVal.error });
      record.vitals = vitVal.sanitized;
    }

    await record.save();

    return res.json({
      success: true,
      message: 'Consultation draft updated successfully',
      consultation: record
    });
  } catch (error) {
    console.error('Error updating doctor consultation:', error);
    return res.status(500).json({ success: false, message: 'Server error updating consultation' });
  }
};

/**
 * DELETE /api/doctors/patients/:patientId/consultations/:id
 * Delete only DRAFT consultation records. SIGNED or AMENDED records cannot be deleted.
 */
export const deleteDoctorConsultationDraft = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const record = await DoctorConsultationRecord.findOne({
      _id: id,
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const linkCheck = await assertClinicAppointmentLink(record, doctorId, clinicPatientId);
    if (!linkCheck.ok) {
      return res.status(linkCheck.status).json({ success: false, message: linkCheck.message });
    }

    // Only DRAFT records can be deleted
    if (record.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete consultation with status '${record.status}'. Signed clinical records cannot be deleted.`
      });
    }

    await DoctorConsultationRecord.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Consultation draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor consultation draft:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting consultation draft' });
  }
};

/**
 * POST /api/doctors/patients/:patientId/consultations/:id/sign
 * Transitions a DRAFT consultation to SIGNED.
 * Server stamps signedAt and seals the record immutably.
 */
export const signDoctorConsultation = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const record = await DoctorConsultationRecord.findOne({
      _id: id,
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    const linkCheck = await assertClinicAppointmentLink(record, doctorId, clinicPatientId);
    if (!linkCheck.ok) {
      return res.status(linkCheck.status).json({ success: false, message: linkCheck.message });
    }

    if (record.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Record is already ${record.status}. Only DRAFT records can be signed.`
      });
    }

    // If this record is an amendment, mark the referenced record as AMENDED
    if (record.amendedRecordId) {
      await DoctorConsultationRecord.updateOne(
        { _id: record.amendedRecordId, doctorId },
        { $set: { status: 'AMENDED' } }
      );
    }

    // Seal the record
    record.status = 'SIGNED';
    record.signedAt = new Date();

    await record.save();

    return res.json({
      success: true,
      message: 'Consultation record signed and sealed successfully',
      consultation: record
    });
  } catch (error) {
    console.error('Error signing doctor consultation:', error);
    return res.status(500).json({ success: false, message: 'Server error signing consultation' });
  }
};

/**
 * POST /api/doctors/patients/:patientId/consultations/:id/amend
 * Create a new DRAFT amendment record referencing a SIGNED record.
 * The original signed record remains untouched (and preserves history).
 */
export const createDoctorConsultationAmendment = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const scope = await resolveConsultationScope(req);
    if (!scope.ok) {
      return res.status(scope.status).json({ success: false, message: scope.message });
    }
    const { patientId, clinicPatientId } = scope;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    // Find the original record
    const originalRecord = await DoctorConsultationRecord.findOne({
      _id: id,
      doctorId,
      ...(clinicPatientId ? { clinicPatientId } : { patientId })
    });

    if (!originalRecord) {
      return res.status(404).json({ success: false, message: 'Original consultation record not found' });
    }

    const linkCheck = await assertClinicAppointmentLink(originalRecord, doctorId, clinicPatientId);
    if (!linkCheck.ok) {
      return res.status(linkCheck.status).json({ success: false, message: linkCheck.message });
    }

    // Must be SIGNED or AMENDED to create an amendment
    if (originalRecord.status !== 'SIGNED' && originalRecord.status !== 'AMENDED') {
      return res.status(400).json({
        success: false,
        message: `Cannot amend a record with status '${originalRecord.status}'. Only signed records can be amended.`
      });
    }

    // Check if an uncompleted DRAFT amendment already exists for this record
    const existingDraftAmendment = await DoctorConsultationRecord.findOne({
      doctorId,
      amendedRecordId: originalRecord._id,
      status: 'DRAFT'
    });
    if (existingDraftAmendment) {
      return res.status(409).json({
        success: false,
        message: 'A draft amendment already exists for this consultation record',
        draftAmendmentId: existingDraftAmendment._id
      });
    }

    // Create the new amendment record starting as DRAFT prefilled with original values
    const amendmentRecord = new DoctorConsultationRecord({
      doctorId,
      patientId: originalRecord.patientId || null,
      clinicPatientId: originalRecord.clinicPatientId || null,
      appointmentId: originalRecord.appointmentId,
      clinicId: originalRecord.clinicId,
      serviceId: originalRecord.serviceId,
      consultationType: originalRecord.consultationType,
      chiefComplaint: originalRecord.chiefComplaint,
      history: originalRecord.history,
      examination: originalRecord.examination,
      diagnosis: originalRecord.diagnosis ? originalRecord.diagnosis.map(d => ({ name: d.name, icdCode: d.icdCode })) : [],
      treatmentPlan: originalRecord.treatmentPlan,
      vitals: originalRecord.vitals ? { ...originalRecord.vitals.toObject?.() || originalRecord.vitals } : {},
      status: 'DRAFT',
      signedAt: null,
      createdByRole: 'DOCTOR',
      amendedRecordId: originalRecord._id
    });

    await amendmentRecord.save();

    return res.status(201).json({
      success: true,
      message: 'Draft amendment created successfully',
      consultation: amendmentRecord
    });
  } catch (error) {
    console.error('Error creating consultation amendment:', error);
    return res.status(500).json({ success: false, message: 'Server error creating consultation amendment' });
  }
};
