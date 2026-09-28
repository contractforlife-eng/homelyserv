// backend/src/controllers/doctorClinicPatientController.js
// ============================================================
// CLINIC PATIENT (Doctor) — Phase 1
// Independent, doctor-owned patient records that do NOT require a
// HomelyServ User account.
//
// SCOPE BOUNDARY (important):
// This controller is intentionally SEPARATE from the existing
// HomelyServ User-patient logic in doctorPatientController.js.
// It does NOT touch, wrap or relax:
//   - hasValidDoctorPatientRelationship (doctorPatientAccessService)
//   - DoctorPatientLink / PatientMedicalProfile
//   - DoctorAppointment / DoctorConsultationRecord / Prescription
// So every existing HomelyServ patient keeps its current behaviour,
// including the appointment + consent + Premium gates.
//
// OWNERSHIP / AUTHZ:
// Every query is scoped by `doctorId: req.userId`. A doctor can never
// read or modify another doctor's ClinicPatient: those requests return
// 404 (not 403) so the API never confirms that a given ID exists.
//
// PHASE 2 (not implemented here):
//   - Appointments referencing a ClinicPatient  (Phase 2B — see
//     getClinicPatientAppointments below)
//   - Consultations / diagnosis / treatment plan
//   - Prescriptions + issuing + printing
//   - Optional linking to a HomelyServ account
// ============================================================
import ClinicPatient, { CLINIC_PATIENT_SEX_VALUES } from '../models/ClinicPatient.js';
import DoctorAppointment from '../models/DoctorAppointment.js';

const isValidObjectId = (id) =>
  typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const MAX = {
  fullName: 150,
  phone: 50,
  email: 100,
  address: 255,
  notes: 2000
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanString = (value, max) => (
  typeof value === 'string' ? value.trim().slice(0, max) : ''
);

/** Normalises optional DOB. { ok, value } so caller can answer 400. */
const parseDateOfBirth = (value) => {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false };
  if (date.getTime() > Date.now()) return { ok: false };
  return { ok: true, value: date };
};

const parseSex = (value) => {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  const upper = String(value).toUpperCase();
  if (!CLINIC_PATIENT_SEX_VALUES.includes(upper)) return { ok: false };
  return { ok: true, value: upper };
};

const parseOptionalId = (value) => {
  if (value === null || value === undefined || value === '') {
    return { ok: true, value: null };
  }
  if (!isValidObjectId(String(value))) return { ok: false };
  return { ok: true, value: String(value) };
};

/**
 * Builds the safe, client-facing shape of a ClinicPatient.
 * Plain values only, so the frontend never has to know about Mongo.
 */
export const toClinicPatientDto = (doc) => {
  if (!doc) return null;
  const d = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  return {
    patientId: String(d._id),
    doctorId: String(d.doctorId),
    clinicId: d.clinicId ? String(d.clinicId) : null,
    linkedUserId: d.linkedUserId ? String(d.linkedUserId) : null,
    fullName: d.fullName || '',
    phone: d.phone || '',
    email: d.email || '',
    dateOfBirth: d.dateOfBirth || null,
    sex: d.sex || null,
    address: d.address || '',
    notes: d.notes || '',
    isActive: d.isActive !== false,
    createdAt: d.createdAt || null,
    updatedAt: d.updatedAt || null
  };
};

/**
 * POST /api/doctors/clinic-patients
 * Creates an independent clinic patient. No HomelyServ account needed.
 */
export const createClinicPatient = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    const fullName = cleanString(body.fullName, MAX.fullName);
    if (!fullName) {
      return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    const dob = parseDateOfBirth(body.dateOfBirth);
    if (!dob.ok) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth must be a valid past date'
      });
    }

    const sex = parseSex(body.sex);
    if (!sex.ok) {
      return res.status(400).json({
        success: false,
        message: 'Sex must be one of MALE, FEMALE, OTHER'
      });
    }

    const clinicId = parseOptionalId(body.clinicId);
    if (!clinicId.ok) {
      return res.status(400).json({ success: false, message: 'Invalid clinicId' });
    }

    // Optional — a walk-in clinic patient simply has no account link.
    const linkedUserId = parseOptionalId(body.linkedUserId);
    if (!linkedUserId.ok) {
      return res.status(400).json({ success: false, message: 'Invalid linkedUserId' });
    }

    const email = cleanString(body.email, MAX.email).toLowerCase();
    if (email && !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address' });
    }

    const created = await ClinicPatient.create({
      doctorId,
      clinicId: clinicId.value,
      linkedUserId: linkedUserId.value,
      fullName,
      phone: cleanString(body.phone, MAX.phone),
      email,
      dateOfBirth: dob.value,
      sex: sex.value,
      address: cleanString(body.address, MAX.address),
      notes: cleanString(body.notes, MAX.notes)
    });

    return res.status(201).json({
      success: true,
      message: 'Clinic patient created',
      patient: toClinicPatientDto(created)
    });
  } catch (error) {
    // Surface Mongoose validation errors as 400 rather than 500.
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error creating clinic patient:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error creating clinic patient'
    });
  }
};

/**
 * GET /api/doctors/clinic-patients
 * Lists only the authenticated doctor's own clinic patients.
 */
export const getClinicPatients = async (req, res) => {
  try {
    const doctorId = req.userId;
    const patients = await ClinicPatient.find({ doctorId }).sort({ createdAt: -1 });
    const list = (Array.isArray(patients) ? patients : []).map(toClinicPatientDto);
    return res.json({ success: true, count: list.length, patients: list });
  } catch (error) {
    console.error('Error listing clinic patients:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error listing clinic patients'
    });
  }
};

/**
 * GET /api/doctors/clinic-patients/:patientId
 * Scoped by doctorId, so another doctor's patient is a 404.
 */
export const getClinicPatientById = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(String(patientId || ''))) {
      return res.status(404).json({ success: false, message: 'Clinic patient not found' });
    }

    const patient = await ClinicPatient.findOne({ _id: patientId, doctorId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Clinic patient not found' });
    }

    return res.json({ success: true, patient: toClinicPatientDto(patient) });
  } catch (error) {
    console.error('Error loading clinic patient:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error loading clinic patient'
    });
  }
};


/**
 * PUT /api/doctors/clinic-patients/:patientId
 * Partial update. doctorId is never read from the body, so ownership
 * can never be reassigned by a client.
 */
export const updateClinicPatient = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(String(patientId || ''))) {
      return res.status(404).json({ success: false, message: 'Clinic patient not found' });
    }

    const patient = await ClinicPatient.findOne({ _id: patientId, doctorId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Clinic patient not found' });
    }

    if (body.fullName !== undefined) {
      const fullName = cleanString(body.fullName, MAX.fullName);
      if (!fullName) {
        return res.status(400).json({ success: false, message: 'Full name cannot be empty' });
      }
      patient.fullName = fullName;
    }

    if (body.phone !== undefined) {
      patient.phone = cleanString(body.phone, MAX.phone);
    }

    if (body.email !== undefined) {
      const email = cleanString(body.email, MAX.email).toLowerCase();
      if (email && !EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email address' });
      }
      patient.email = email;
    }

    if (body.dateOfBirth !== undefined) {
      const dob = parseDateOfBirth(body.dateOfBirth);
      if (!dob.ok) {
        return res.status(400).json({
          success: false,
          message: 'Date of birth must be a valid past date'
        });
      }
      patient.dateOfBirth = dob.value;
    }

    if (body.sex !== undefined) {
      const sex = parseSex(body.sex);
      if (!sex.ok) {
        return res.status(400).json({
          success: false,
          message: 'Sex must be one of MALE, FEMALE, OTHER'
        });
      }
      patient.sex = sex.value;
    }

    if (body.address !== undefined) {
      patient.address = cleanString(body.address, MAX.address);
    }

    if (body.notes !== undefined) {
      patient.notes = cleanString(body.notes, MAX.notes);
    }

    if (body.clinicId !== undefined) {
      const clinicId = parseOptionalId(body.clinicId);
      if (!clinicId.ok) {
        return res.status(400).json({ success: false, message: 'Invalid clinicId' });
      }
      patient.clinicId = clinicId.value;
    }

    if (body.linkedUserId !== undefined) {
      const linkedUserId = parseOptionalId(body.linkedUserId);
      if (!linkedUserId.ok) {
        return res.status(400).json({ success: false, message: 'Invalid linkedUserId' });
      }
      patient.linkedUserId = linkedUserId.value;
    }

    if (body.isActive !== undefined) {
      patient.isActive = Boolean(body.isActive);
    }

    await patient.save();

    return res.json({
      success: true,
      message: 'Clinic patient updated',
      patient: toClinicPatientDto(patient)
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Error updating clinic patient:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating clinic patient'
    });
  }
};


/**
 * GET /api/doctors/clinic-patients/:patientId/appointments
 * Phase 2B — appointments belonging to one of THIS doctor's ClinicPatients.
 *
 * Ownership is verified twice: the ClinicPatient must be owned by
 * req.userId, AND every returned appointment is scoped by doctorId.
 * `linkedUserId` is never consulted.
 *
 * Returns upcoming and past buckets so the Patient File can render both
 * without a second request. No clinical content is included — this phase
 * deliberately stops at appointments (no consultations/prescriptions).
 */
export const getClinicPatientAppointments = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(String(patientId || ''))) {
      return res.status(404).json({ success: false, message: 'Clinic patient not found' });
    }

    const patient = await ClinicPatient.findOne({ _id: patientId, doctorId });
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Clinic patient not found' });
    }

    const appointments = await DoctorAppointment.find({ doctorId, clinicPatientId: patientId })
      .populate('clinicId', 'clinicName addressLine city isPrimary')
      .populate('serviceId', 'serviceName price durationMinutes')
      .sort({ startsAt: -1 });

    const now = new Date();
    const active = ['PENDING', 'CONFIRMED'];

    const map = (apt) => ({
      appointmentId: String(apt._id),
      clinicPatientId: String(apt.clinicPatientId),
      startsAt: apt.startsAt,
      endsAt: apt.endsAt,
      status: apt.status,
      consultationType: apt.consultationType,
      reason: apt.reason || '',
      notes: apt.notes || '',
      feeSnapshot: apt.feeSnapshot || 0,
      currency: apt.currency || 'EGP',
      clinic: apt.clinicId
        ? {
            clinicId: String(apt.clinicId._id),
            clinicName: apt.clinicId.clinicName,
            addressLine: apt.clinicId.addressLine,
            city: apt.clinicId.city
          }
        : null,
      service: apt.serviceId
        ? {
            serviceId: String(apt.serviceId._id),
            serviceName: apt.serviceId.serviceName,
            price: apt.serviceId.price,
            durationMinutes: apt.serviceId.durationMinutes
          }
        : null
    });

    const all = appointments.map(map);
    const upcoming = all.filter(
      (a) => active.includes(a.status) && new Date(a.startsAt) >= now
    );
    const past = all.filter((a) => !upcoming.includes(a));

    return res.json({
      success: true,
      patient: { patientId: String(patient._id), fullName: patient.fullName },
      upcoming,
      past
    });
  } catch (error) {
    console.error('Error loading clinic patient appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error loading appointments'
    });
  }
};

