// backend/src/controllers/doctorPrescriptionController.js
import crypto from 'crypto';
import mongoose from 'mongoose';
import Prescription, { PRESCRIPTION_STATUSES } from '../models/Prescription.js';
import DoctorConsultationRecord from '../models/DoctorConsultationRecord.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import DoctorClinic from '../models/DoctorClinic.js';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

/**
 * Generate human-readable unique prescription number:
 * RX-YYYYMMDD-XXXXXX (e.g. RX-20260928-A4F92B)
 */
export const generatePrescriptionNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randHex = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `RX-${dateStr}-${randHex}`;
};

/**
 * Validates and sanitizes medication items.
 * Each item requires: drugName, dosage, frequency, duration.
 * Optional: strength, form, quantity, instructions.
 */
export const validateAndSanitizeMedicationItems = (items) => {
  if (items === undefined || items === null) {
    return { valid: true, sanitized: [] };
  }
  if (!Array.isArray(items)) {
    return { valid: false, error: 'Medications (items) must be an array' };
  }
  if (items.length > 50) {
    return { valid: false, error: 'Maximum 50 medication items allowed per prescription' };
  }

  const allowedKeys = [
    'drugName',
    'strength',
    'form',
    'dosage',
    'frequency',
    'duration',
    'quantity',
    'instructions'
  ];

  const sanitized = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, error: `Item at index ${i} must be an object` };
    }

    for (const k of Object.keys(item)) {
      if (!allowedKeys.includes(k)) {
        return { valid: false, error: `Invalid field '${k}' in medication item at index ${i}` };
      }
    }

    // Required fields: drugName, dosage, frequency, duration
    const reqFields = ['drugName', 'dosage', 'frequency', 'duration'];
    for (const f of reqFields) {
      if (typeof item[f] !== 'string' || !item[f].trim()) {
        return { valid: false, error: `Medication item at index ${i} requires '${f}'` };
      }
    }

    if (item.drugName.trim().length > 200) {
      return { valid: false, error: `Medication drugName at index ${i} exceeds 200 characters` };
    }
    if (item.dosage.trim().length > 150) {
      return { valid: false, error: `Medication dosage at index ${i} exceeds 150 characters` };
    }
    if (item.frequency.trim().length > 150) {
      return { valid: false, error: `Medication frequency at index ${i} exceeds 150 characters` };
    }
    if (item.duration.trim().length > 100) {
      return { valid: false, error: `Medication duration at index ${i} exceeds 100 characters` };
    }

    sanitized.push({
      drugName: item.drugName.trim(),
      strength: typeof item.strength === 'string' ? item.strength.trim().slice(0, 100) : '',
      form: typeof item.form === 'string' ? item.form.trim().slice(0, 100) : '',
      dosage: item.dosage.trim(),
      frequency: item.frequency.trim(),
      duration: item.duration.trim(),
      quantity: typeof item.quantity === 'string' ? item.quantity.trim().slice(0, 50) : '',
      instructions: typeof item.instructions === 'string' ? item.instructions.trim().slice(0, 500) : ''
    });
  }

  return { valid: true, sanitized };
};

/**
 * Builds the immutable server-generated snapshot of doctor, patient, clinic, consultation data.
 */
export const buildDocumentSnapshot = async (consultation) => {
  const doctor = await User.findById(consultation.doctorId).select('fullName email phone');
  const patient = await User.findById(consultation.patientId).select('fullName email phone city countryName');
  const doctorProfile = await DoctorProfile.findOne({ userId: consultation.doctorId }).select('professionalTitle specialty');
  let clinic = null;
  if (consultation.clinicId) {
    clinic = await DoctorClinic.findById(consultation.clinicId).select('clinicName addressLine city phone');
  }

  const diagnosisSummary = Array.isArray(consultation.diagnosis)
    ? consultation.diagnosis.map((d) => d.name + (d.icdCode ? ` (${d.icdCode})` : '')).join(', ')
    : '';

  return {
    doctor: {
      fullName: doctor?.fullName || 'Doctor',
      professionalRole: 'DOCTOR',
      professionalTitle: doctorProfile?.professionalTitle || '',
      specialty: doctorProfile?.specialty || '',
      email: doctor?.email || '',
      phone: doctor?.phone || ''
    },
    patient: {
      fullName: patient?.fullName || 'Patient',
      email: patient?.email || '',
      phone: patient?.phone || '',
      city: patient?.city || '',
      countryName: patient?.countryName || ''
    },
    clinic: {
      clinicName: clinic?.clinicName || '',
      addressLine: clinic?.addressLine || '',
      city: clinic?.city || '',
      phone: clinic?.phone || ''
    },
    consultation: {
      consultationType: consultation.consultationType || '',
      appointmentDate: consultation.appointmentId?.appointmentDate || consultation.createdAt?.toISOString?.()?.slice(0, 10) || '',
      diagnosisSummary
    }
  };
};

/**
 * GET /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions
 * List all prescriptions for a specific consultation owned by the Doctor.
 */
export const getDoctorConsultationPrescriptions = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId } = req.params;

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId)) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const consultation = await DoctorConsultationRecord.findOne({
      _id: consultationId,
      doctorId,
      patientId
    });

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    const prescriptions = await Prescription.find({
      consultationRecordId: consultationId,
      doctorId,
      patientId
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: prescriptions.length,
      prescriptions
    });
  } catch (error) {
    console.error('Error fetching consultation prescriptions:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching prescriptions' });
  }
};

/**
 * GET /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions/:id
 * Get single prescription details for the Doctor.
 */
export const getDoctorConsultationPrescriptionById = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId, id } = req.params;

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId) || !isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      consultationRecordId: consultationId,
      doctorId,
      patientId
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    return res.json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Error fetching prescription by id:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching prescription' });
  }
};

/**
 * POST /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions
 * Create a new DRAFT prescription tied to a SIGNED consultation.
 */
export const createDoctorPrescription = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId } = req.params;
    const { items, notes, validUntil, followUpDate } = req.body || {};

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId)) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // Verify consultation existence and Doctor ownership
    const consultation = await DoctorConsultationRecord.findOne({
      _id: consultationId,
      doctorId,
      patientId
    });

    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation record not found' });
    }

    // Must be SIGNED or AMENDED (not DRAFT)
    if (consultation.status !== 'SIGNED' && consultation.status !== 'AMENDED') {
      return res.status(400).json({
        success: false,
        message: `Cannot create prescription for consultation in status '${consultation.status}'. Consultation must be SIGNED.`
      });
    }

    // Validate medication items
    const medVal = validateAndSanitizeMedicationItems(items);
    if (!medVal.valid) {
      return res.status(400).json({ success: false, message: medVal.error });
    }

    // Validate notes
    let sanitizedNotes = '';
    if (notes !== undefined && notes !== null) {
      if (typeof notes !== 'string') {
        return res.status(400).json({ success: false, message: 'Notes must be a string' });
      }
      sanitizedNotes = notes.trim();
      if (sanitizedNotes.length > 2000) {
        return res.status(400).json({ success: false, message: 'Notes cannot exceed 2000 characters' });
      }
    }

    // Build document snapshot server-side
    const snapshot = await buildDocumentSnapshot(consultation);

    // Generate unique prescription number
    let prescriptionNumber = generatePrescriptionNumber();
    while (await Prescription.exists({ prescriptionNumber })) {
      prescriptionNumber = generatePrescriptionNumber();
    }

    const prescription = new Prescription({
      prescriptionNumber,
      consultationRecordId: consultation._id,
      doctorId,
      patientId: consultation.patientId,
      issuedAt: null,
      validUntil: validUntil ? new Date(validUntil) : null,
      followUpDate: followUpDate ? new Date(followUpDate) : null,
      items: medVal.sanitized,
      notes: sanitizedNotes,
      status: 'DRAFT',
      documentSnapshot: snapshot
    });

    await prescription.save();

    return res.status(201).json({
      success: true,
      message: 'Prescription draft created successfully',
      prescription
    });
  } catch (error) {
    console.error('Error creating doctor prescription:', error);
    return res.status(500).json({ success: false, message: 'Server error creating prescription' });
  }
};

/**
 * PUT /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions/:id
 * Update only DRAFT prescriptions.
 */
export const updateDoctorPrescription = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId, id } = req.params;

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId) || !isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      consultationRecordId: consultationId,
      doctorId,
      patientId
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    // IMMUTABILITY: Only DRAFT prescriptions can be edited
    if (prescription.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Only DRAFT prescriptions can be edited. Prescription is currently '${prescription.status}' and immutable.`
      });
    }

    const { items, notes, validUntil, followUpDate } = req.body || {};

    if (items !== undefined) {
      const medVal = validateAndSanitizeMedicationItems(items);
      if (!medVal.valid) {
        return res.status(400).json({ success: false, message: medVal.error });
      }
      prescription.items = medVal.sanitized;
    }

    if (notes !== undefined) {
      if (notes === null) {
        prescription.notes = '';
      } else if (typeof notes === 'string') {
        const trimmed = notes.trim();
        if (trimmed.length > 2000) {
          return res.status(400).json({ success: false, message: 'Notes cannot exceed 2000 characters' });
        }
        prescription.notes = trimmed;
      } else {
        return res.status(400).json({ success: false, message: 'Notes must be a string' });
      }
    }

    if (validUntil !== undefined) {
      prescription.validUntil = validUntil ? new Date(validUntil) : null;
    }

    if (followUpDate !== undefined) {
      prescription.followUpDate = followUpDate ? new Date(followUpDate) : null;
    }

    await prescription.save();

    return res.json({
      success: true,
      message: 'Prescription draft updated successfully',
      prescription
    });
  } catch (error) {
    console.error('Error updating doctor prescription:', error);
    return res.status(500).json({ success: false, message: 'Server error updating prescription' });
  }
};

/**
 * DELETE /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions/:id
 * Delete only DRAFT prescriptions.
 */
export const deleteDoctorPrescriptionDraft = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId, id } = req.params;

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId) || !isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      consultationRecordId: consultationId,
      doctorId,
      patientId
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete prescription in status '${prescription.status}'. Issued or cancelled prescriptions cannot be deleted.`
      });
    }

    await Prescription.deleteOne({ _id: id });

    return res.json({
      success: true,
      message: 'Prescription draft deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting prescription draft:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting prescription draft' });
  }
};

/**
 * POST /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions/:id/issue
 * Transitions DRAFT -> ISSUED. Sets issuedAt server-side.
 * Record becomes immutable.
 */
export const issueDoctorPrescription = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId, id } = req.params;

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId) || !isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      consultationRecordId: consultationId,
      doctorId,
      patientId
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: `Prescription is already ${prescription.status}. Only DRAFT prescriptions can be issued.`
      });
    }

    // Must have at least one medication item to be issued
    if (!Array.isArray(prescription.items) || prescription.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot issue an empty prescription. Add at least one medication item.'
      });
    }

    prescription.status = 'ISSUED';
    prescription.issuedAt = new Date();

    await prescription.save();

    return res.json({
      success: true,
      message: 'Prescription issued and sealed successfully',
      prescription
    });
  } catch (error) {
    console.error('Error issuing prescription:', error);
    return res.status(500).json({ success: false, message: 'Server error issuing prescription' });
  }
};

/**
 * POST /api/doctors/patients/:patientId/consultations/:consultationId/prescriptions/:id/cancel
 * Transitions ISSUED -> CANCELLED with reason.
 * Cannot cancel a DRAFT.
 */
export const cancelDoctorPrescription = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, consultationId, id } = req.params;
    const { cancellationReason } = req.body || {};

    if (!isValidObjectId(patientId) || !isValidObjectId(consultationId) || !isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const prescription = await Prescription.findOne({
      _id: id,
      consultationRecordId: consultationId,
      doctorId,
      patientId
    });

    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    if (prescription.status !== 'ISSUED') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel prescription in status '${prescription.status}'. Only ISSUED prescriptions can be cancelled.`
      });
    }

    prescription.status = 'CANCELLED';
    prescription.cancelledAt = new Date();
    prescription.cancelledBy = doctorId;
    prescription.cancellationReason = typeof cancellationReason === 'string'
      ? cancellationReason.trim().slice(0, 1000)
      : '';

    await prescription.save();

    return res.json({
      success: true,
      message: 'Prescription cancelled successfully',
      prescription
    });
  } catch (error) {
    console.error('Error cancelling prescription:', error);
    return res.status(500).json({ success: false, message: 'Server error cancelling prescription' });
  }
};
