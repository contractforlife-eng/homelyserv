// backend/src/controllers/doctorServiceController.js
// ============================================================
// DOCTOR SERVICES & PRICING (Doctor Center)
// Manages the doctor's bookable consultation/service offerings
// on the EXISTING DoctorConsultationService model. These prices
// are HomelyServ bookable-service prices and are intentionally
// separate from DoctorProfile.consultationFee/examinationFee,
// which remain untouched on the Doctor Profile page.
//
// Security: doctorId is ALWAYS derived from the authenticated
// user (req.userId) — never from the request body. Cross-doctor
// access returns 404 (no existence leak).
// ============================================================
import mongoose from 'mongoose';
import DoctorConsultationService, { DOCTOR_CONSULTATION_TYPES } from '../models/DoctorConsultationService.js';
import DoctorClinic from '../models/DoctorClinic.js';
import DoctorSchedule from '../models/DoctorSchedule.js';
import DoctorAppointment from '../models/DoctorAppointment.js';

const isValidObjectId = (id) => typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

const SERVICE_NAME_MAX = 150;
const DESCRIPTION_MAX = 2000;

/**
 * GET /api/doctors/services
 * List all services owned by the authenticated doctor.
 */
export const getDoctorServices = async (req, res) => {
  try {
    const doctorId = req.userId;
    const services = await DoctorConsultationService.find({ doctorId }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    console.error('Error fetching doctor services:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching services' });
  }
};

/**
 * GET /api/doctors/services/:id
 * Get a single owned service.
 */
export const getDoctorServiceById = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = await DoctorConsultationService.findOne({ _id: id, doctorId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    return res.json({ success: true, service });
  } catch (error) {
    console.error('Error fetching doctor service:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching service' });
  }
};

/**
 * Validates service payload fields shared by create and update.
 * Returns { valid, error, value }.
 */
export const validateServicePayload = async ({ doctorId, body, partial }) => {
  const value = {};

  if (!partial || body.consultationType !== undefined) {
    if (!DOCTOR_CONSULTATION_TYPES.includes(body.consultationType)) {
      return {
        valid: false,
        error: `Invalid consultation type. Must be one of: ${DOCTOR_CONSULTATION_TYPES.join(', ')}`
      };
    }
    value.consultationType = body.consultationType;
  }

  if (!partial || body.serviceName !== undefined) {
    if (typeof body.serviceName !== 'string' || !body.serviceName.trim()) {
      return { valid: false, error: 'Service name is required' };
    }
    if (body.serviceName.trim().length > SERVICE_NAME_MAX) {
      return { valid: false, error: `Service name cannot exceed ${SERVICE_NAME_MAX} characters` };
    }
    value.serviceName = body.serviceName.trim();
  }

  if (body.description !== undefined) {
    if (body.description === null) {
      value.description = '';
    } else if (typeof body.description !== 'string') {
      return { valid: false, error: 'Description must be a string' };
    } else {
      if (body.description.trim().length > DESCRIPTION_MAX) {
        return { valid: false, error: `Description cannot exceed ${DESCRIPTION_MAX} characters` };
      }
      value.description = body.description.trim();
    }
  }

  if (!partial || body.durationMinutes !== undefined) {
    const duration = Number(body.durationMinutes === undefined ? 30 : body.durationMinutes);
    if (!Number.isFinite(duration) || !Number.isInteger(duration) || duration < 5 || duration > 480) {
      return { valid: false, error: 'Duration must be an integer between 5 and 480 minutes' };
    }
    value.durationMinutes = duration;
  }

  if (!partial || body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0) {
      return { valid: false, error: 'Price must be a non-negative number' };
    }
    value.price = price;
  }

  if (body.followUpPrice !== undefined) {
    const followUpPrice = Number(body.followUpPrice);
    if (!Number.isFinite(followUpPrice) || followUpPrice < 0) {
      return { valid: false, error: 'Follow-up price must be a non-negative number' };
    }
    value.followUpPrice = followUpPrice;
  }

  if (body.followUpWindowDays !== undefined) {
    const days = Number(body.followUpWindowDays);
    if (!Number.isFinite(days) || !Number.isInteger(days) || days < 0 || days > 90) {
      return { valid: false, error: 'Follow-up window must be between 0 and 90 days' };
    }
    value.followUpWindowDays = days;
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return { valid: false, error: 'isActive must be a boolean' };
    }
    value.isActive = body.isActive;
  }

  // Clinic association (optional). The clinic must be owned by the doctor.
  if (body.clinicId !== undefined) {
    if (body.clinicId === null || body.clinicId === '') {
      value.clinicId = null;
    } else if (!isValidObjectId(String(body.clinicId))) {
      return { valid: false, error: 'Invalid clinic ID format' };
    } else {
      const clinic = await DoctorClinic.findOne({ _id: body.clinicId, doctorId });
      if (!clinic) {
        return { valid: false, error: 'Clinic not found or not owned by doctor' };
      }
      value.clinicId = clinic._id;
    }
  }

  return { valid: true, value };
};

/**
 * POST /api/doctors/services
 * Create a new service. doctorId derived from the authenticated doctor.
 */
export const createDoctorService = async (req, res) => {
  try {
    const doctorId = req.userId;
    const body = req.body || {};

    const validation = await validateServicePayload({ doctorId, body, partial: false });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    const service = await DoctorConsultationService.create({
      doctorId,
      ...validation.value,
      isActive: validation.value.isActive === undefined ? true : validation.value.isActive
    });

    return res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Error creating doctor service:', error);
    return res.status(500).json({ success: false, message: 'Server error creating service' });
  }
};

/**
 * PUT /api/doctors/services/:id
 * Update an owned service (including isActive to activate/deactivate).
 */
export const updateDoctorService = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const body = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = await DoctorConsultationService.findOne({ _id: id, doctorId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const validation = await validateServicePayload({ doctorId, body, partial: true });
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error });
    }

    Object.assign(service, validation.value);
    await service.save();

    return res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Error updating doctor service:', error);
    return res.status(500).json({ success: false, message: 'Server error updating service' });
  }
};

/**
 * PUT /api/doctors/services/:id/active
 * Dedicated activate/deactivate endpoint. Body: { isActive: boolean }
 */
export const setDoctorServiceActive = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;
    const { isActive } = req.body || {};

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }

    const service = await DoctorConsultationService.findOne({ _id: id, doctorId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = isActive;
    await service.save();

    return res.json({
      success: true,
      message: isActive ? 'Service activated' : 'Service deactivated',
      service
    });
  } catch (error) {
    console.error('Error toggling doctor service:', error);
    return res.status(500).json({ success: false, message: 'Server error toggling service' });
  }
};

/**
 * DELETE /api/doctors/services/:id
 * Deletes a service only when it is safe: no schedule slots reference it and
 * no active (PENDING/CONFIRMED) appointments reference it. Historical
 * appointments that already completed keep their stored fee snapshot, so they
 * do not block deletion.
 */
export const deleteDoctorService = async (req, res) => {
  try {
    const doctorId = req.userId;
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const service = await DoctorConsultationService.findOne({ _id: id, doctorId });
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const [scheduleCount, activeAppointmentCount] = await Promise.all([
      DoctorSchedule.countDocuments({ doctorId, serviceId: id }),
      DoctorAppointment.countDocuments({
        doctorId,
        serviceId: id,
        status: { $in: ['PENDING', 'CONFIRMED'] }
      })
    ]);

    if (scheduleCount > 0 || activeAppointmentCount > 0) {
      return res.status(409).json({
        success: false,
        message: 'This service cannot be deleted while schedule slots or active appointments reference it. Deactivate it instead.',
        scheduleCount,
        activeAppointmentCount
      });
    }

    await DoctorConsultationService.deleteOne({ _id: id, doctorId });

    return res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting doctor service:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting service' });
  }
};
