// backend/src/controllers/doctorMedicalCenterController.js
// ============================================================
// HOMELYSERV MEDICAL CENTER (Doctor)
// Server-authoritative controller for the doctor's medical
// workspace. Reuses the EXISTING DoctorProfile fee fields
// (examinationFee / consultationFee) — no second pricing source.
//
// Patient visibility rules (unchanged security model):
//  - A patient appears in the doctor's Medical Center list only
//    through a real DoctorAppointment relationship (any status,
//    via the patients controller aggregate) or an explicit
//    DoctorPatientLink (which itself requires an appointment to
//    have existed). Medical DATA access still requires the
//    established-relationship + consent + Premium + audit path.
// ============================================================
import mongoose from 'mongoose';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import DoctorPatientLink from '../models/DoctorPatientLink.js';
import DoctorAppointment from '../models/DoctorAppointment.js';
import { hasValidDoctorPatientRelationship } from '../services/doctorPatientAccessService.js';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

// Shared monetary rule with doctorController: non-negative, max 2 decimals.
const parseDoctorFee = (value) => {
  if (value === null || value === undefined || value === '') return { ok: true, value: 0 };
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return { ok: false };
  const rounded = Math.round(num * 100) / 100;
  return { ok: true, value: rounded };
};

/**
 * GET /api/doctors/medical-center
 * Workspace payload: fees (authoritative DoctorProfile values), patients,
 * and presence info used by HomelyServ Doctor Search.
 */
export const getDoctorMedicalCenter = async (req, res) => {
  try {
    const doctorId = req.userId;

    const profile = await DoctorProfile.findOne({ userId: doctorId })
      .select('examinationFee consultationFee specialty professionalTitle');

    const patientRes = await fetchPatientsInternal(doctorId);

    return res.json({
      success: true,
      fees: {
        examinationFee: Number(profile?.examinationFee) || 0,
        consultationFee: Number(profile?.consultationFee) || 0,
        currency: 'EGP'
      },
      presence: {
        specialty: profile?.specialty || '',
        professionalTitle: profile?.professionalTitle || ''
      },
      patients: patientRes.patients,
      patientsCount: patientRes.count
    });
  } catch (error) {
    console.error('Error loading medical center:', error);
    return res.status(500).json({ success: false, message: 'Server error loading medical center' });
  }
};

/**
 * PUT /api/doctors/medical-center/fees
 * Body: { examinationFee?, consultationFee? }
 * Writes to the EXISTING DoctorProfile fields (single source of truth that
 * Doctor Search and the appointment fee fallback already read).
 */
export const updateDoctorMedicalCenterFees = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, 'examinationFee')) {
      const parsed = parseDoctorFee(body.examinationFee);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, message: 'Examination fee must be a non-negative amount (max 2 decimals)' });
      }
      updates.examinationFee = parsed.value;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'consultationFee')) {
      const parsed = parseDoctorFee(body.consultationFee);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, message: 'Consultation fee must be a non-negative amount (max 2 decimals)' });
      }
      updates.consultationFee = parsed.value;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    const profile = await DoctorProfile.findOneAndUpdate(
      { userId: doctorId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select('examinationFee consultationFee');

    return res.json({
      success: true,
      message: 'Fees updated successfully',
      fees: {
        examinationFee: Number(profile.examinationFee) || 0,
        consultationFee: Number(profile.consultationFee) || 0,
        currency: 'EGP'
      }
    });
  } catch (error) {
    console.error('Error updating medical center fees:', error);
    return res.status(500).json({ success: false, message: 'Server error updating fees' });
  }
};

const fetchPatientsInternal = async (doctorId) => {
  // 1. Appointment-based patients (aggregate identical to the Patients page)
  const appointments = await DoctorAppointment.find({ doctorId })
    .populate('patientId', 'fullName profileImage phone city')
    .sort({ startsAt: -1 });

  const patientMap = new Map();
  for (const apt of appointments) {
    if (!apt.patientId) continue;
    const pId = String(apt.patientId._id || apt.patientId);
    if (!patientMap.has(pId)) {
      patientMap.set(pId, {
        patientId: pId,
        patientName: apt.patientId.fullName || 'Patient',
        profileImage: apt.patientId.profileImage || null,
        city: apt.patientId.city || '',
        lastAppointmentDate: apt.startsAt,
        latestStatus: apt.status,
        linkSource: 'appointment'
      });
    }
  }

  // 2. Explicit doctor-created links (Medical Center)
  const links = await DoctorPatientLink.find({ doctorId, isActive: true })
    .sort({ createdAt: -1 });
  const linkPatientIds = links.map((l) => String(l.patientId));
  const linkedUsers = linkPatientIds.length
    ? await User.find({ _id: { $in: linkPatientIds } }).select('fullName profileImage city')
    : [];
  const linkedMap = new Map(linkedUsers.map((u) => [String(u._id), u]));

  for (const link of links) {
    const pId = String(link.patientId);
    if (!patientMap.has(pId) && linkedMap.has(pId)) {
      const u = linkedMap.get(pId);
      patientMap.set(pId, {
        patientId: pId,
        patientName: u.fullName || 'Patient',
        profileImage: u.profileImage || null,
        city: u.city || '',
        lastAppointmentDate: null,
        latestStatus: null,
        linkSource: 'link'
      });
    }
  }

  const patients = Array.from(patientMap.values());
  return { patients, count: patients.length };
};

/**
 * POST /api/doctors/medical-center/patients
 * Manually associate a HomelyServ member as the doctor's patient.
 * Body: { patientId, note? }
 *
 * Narrow safety rule: the link can only be created when a real
 * DoctorAppointment already exists between the two users (any status).
 * This never grants access to arbitrary users.
 */
export const addMedicalCenterPatient = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId, note } = req.body || {};

    if (!isValidObjectId(String(patientId || ''))) {
      return res.status(400).json({ success: false, message: 'Valid patient ID is required' });
    }
    if (String(patientId) === String(doctorId)) {
      return res.status(400).json({ success: false, message: 'A doctor cannot link themselves as a patient' });
    }

    const patient = await User.findById(patientId).select('fullName role isSuspended');
    if (!patient || patient.isSuspended) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    if (patient.role === 'DOCTOR') {
      return res.status(400).json({ success: false, message: 'Cannot link a doctor as a patient' });
    }

    // The appointment business rule is the gate for manual linking.
    const hasAnyAppointment = await DoctorAppointment.countDocuments({
      doctorId,
      patientId
    });
    if (hasAnyAppointment === 0) {
      return res.status(403).json({
        success: false,
        message: 'A HomelyServ appointment must exist with this member before they can be added as a patient.'
      });
    }

    const existing = await DoctorPatientLink.findOne({ doctorId, patientId });
    if (existing) {
      if (!existing.isActive) {
        existing.isActive = true;
        await existing.save();
      }
      return res.json({ success: true, message: 'Patient already linked', link: existing });
    }

    const link = await DoctorPatientLink.create({
      doctorId,
      patientId,
      createdBy: doctorId,
      note: typeof note === 'string' ? note.trim().slice(0, 500) : ''
    });

    return res.status(201).json({
      success: true,
      message: 'Patient added to your Medical Center',
      link
    });
  } catch (error) {
    console.error('Error adding medical center patient:', error);
    return res.status(500).json({ success: false, message: 'Server error adding patient' });
  }
};

/**
 * DELETE /api/doctors/medical-center/patients/:patientId
 * Removes the explicit link. Appointment-derived patients stay governed by
 * their appointment records; this only removes the doctor-created association.
 */
export const removeMedicalCenterPatient = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(patientId)) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const result = await DoctorPatientLink.updateMany(
      { doctorId, patientId, isActive: true },
      { $set: { isActive: false } }
    );

    return res.json({
      success: true,
      message: result.modifiedCount > 0 ? 'Patient removed from your Medical Center' : 'Patient was not linked',
      removed: result.modifiedCount > 0
    });
  } catch (error) {
    console.error('Error removing medical center patient:', error);
    return res.status(500).json({ success: false, message: 'Server error removing patient' });
  }
};

/**
 * GET /api/doctors/medical-center/patients/:patientId/summary
 * Patient workspace header. Identity is relationship-gated via the SAME
 * hasValidDoctorPatientRelationship used by every medical-data path.
 */
export const getMedicalCenterPatientSummary = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { patientId } = req.params;

    if (!isValidObjectId(patientId)) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const authorized = await hasValidDoctorPatientRelationship(doctorId, patientId);
    if (!authorized) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const patient = await User.findById(patientId).select('fullName profileImage phone city countryName language');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const [appointmentsCount, link] = await Promise.all([
      DoctorAppointment.countDocuments({ doctorId, patientId }),
      DoctorPatientLink.findOne({ doctorId, patientId, isActive: true }).select('note createdAt')
    ]);

    return res.json({
      success: true,
      patient: {
        patientId: String(patient._id),
        patientName: patient.fullName,
        profileImage: patient.profileImage || null,
        phone: patient.phone || '',
        city: patient.city || '',
        countryName: patient.countryName || '',
        language: patient.language || 'en'
      },
      appointmentsCount,
      link: link ? { note: link.note, createdAt: link.createdAt } : null
    });
  } catch (error) {
    console.error('Error loading medical center patient summary:', error);
    return res.status(500).json({ success: false, message: 'Server error loading patient summary' });
  }
};
